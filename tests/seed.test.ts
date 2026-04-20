/// <reference types="jest" />
import { db } from '../db/client';
import { seedTripPlannerIfEmpty } from '../db/seed';

jest.mock('../db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

const mockDb = db as unknown as {
  select: jest.Mock;
  insert: jest.Mock;
};

describe('seedTripPlannerIfEmpty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts seed data into all core tables when users table is empty', async () => {
    const mockUsersAfterInsert = [
      {
        id: 1,
        name: 'Molly Demo',
        email: 'molly@example.com',
        password: 'password123',
        createdAt: '2026-04-13',
      },
    ];

    const mockTrips = [
      {
        id: 1,
        userId: 1,
        title: 'Paris Weekend',
        destination: 'Paris',
        startDate: '2026-05-10',
        endDate: '2026-05-13',
        notes: 'City break with museums and cafes',
      },
      {
        id: 2,
        userId: 1,
        title: 'Italy Summer Trip',
        destination: 'Rome',
        startDate: '2026-06-15',
        endDate: '2026-06-22',
        notes: 'Food, history and sightseeing',
      },
      {
        id: 3,
        userId: 1,
        title: 'Adventure in Kerry',
        destination: 'Kerry',
        startDate: '2026-07-05',
        endDate: '2026-07-09',
        notes: 'Nature and outdoor activities',
      },
    ];

    const mockCategories = [
      { id: 1, userId: 1, name: 'Sightseeing', color: '#3B82F6', icon: 'camera' },
      { id: 2, userId: 1, name: 'Outdoor', color: '#22C55E', icon: 'tree' },
      { id: 3, userId: 1, name: 'Food', color: '#F97316', icon: 'utensils' },
      { id: 4, userId: 1, name: 'Relaxation', color: '#A855F7', icon: 'coffee' },
      { id: 5, userId: 1, name: 'Shopping', color: '#EC4899', icon: 'shopping-bag' },
      { id: 6, userId: 1, name: 'Transport', color: '#6366F1', icon: 'bus' },
      { id: 7, userId: 1, name: 'Culture', color: '#EAB308', icon: 'landmark' },
      { id: 8, userId: 1, name: 'Nightlife', color: '#8B5CF6', icon: 'music' },
    ];

    const selectFromMock = jest
      .fn()
      .mockResolvedValueOnce([]) // existingUsers
      .mockResolvedValueOnce(mockUsersAfterInsert) // seededUsers
      .mockResolvedValueOnce(mockTrips) // seededTrips
      .mockResolvedValueOnce(mockCategories); // seededCategories

    mockDb.select.mockReturnValue({
      from: selectFromMock,
    });

    const usersValuesMock = jest.fn().mockResolvedValue(undefined);
    const tripsValuesMock = jest.fn().mockResolvedValue(undefined);
    const categoriesValuesMock = jest.fn().mockResolvedValue(undefined);
    const activitiesValuesMock = jest.fn().mockResolvedValue(undefined);
    const targetsValuesMock = jest.fn().mockResolvedValue(undefined);

    mockDb.insert
      .mockReturnValueOnce({ values: usersValuesMock })
      .mockReturnValueOnce({ values: tripsValuesMock })
      .mockReturnValueOnce({ values: categoriesValuesMock })
      .mockReturnValueOnce({ values: activitiesValuesMock })
      .mockReturnValueOnce({ values: targetsValuesMock });

    await seedTripPlannerIfEmpty();

    expect(mockDb.insert).toHaveBeenCalledTimes(5);

    expect(usersValuesMock).toHaveBeenCalledWith([
      expect.objectContaining({
        name: 'Molly Demo',
        email: 'molly@example.com',
      }),
    ]);

    expect(tripsValuesMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Paris Weekend' }),
        expect.objectContaining({ title: 'Italy Summer Trip' }),
        expect.objectContaining({ title: 'Adventure in Kerry' }),
      ])
    );

    expect(categoriesValuesMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Sightseeing' }),
        expect.objectContaining({ name: 'Outdoor' }),
        expect.objectContaining({ name: 'Food' }),
        expect.objectContaining({ name: 'Relaxation' }),
      ])
    );

    expect(activitiesValuesMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Eiffel Tower visit' }),
        expect.objectContaining({ title: 'Dinner by the Seine' }),
        expect.objectContaining({ title: 'Mountain hike' }),
      ])
    );

    expect(targetsValuesMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: 'weekly', metricType: 'duration' }),
        expect.objectContaining({ type: 'weekly', metricType: 'count' }),
        expect.objectContaining({ type: 'monthly', metricType: 'duration' }),
      ])
    );
  });

  it('does not insert duplicate data when users already exist', async () => {
    const selectFromMock = jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
        createdAt: '2026-04-13',
      },
    ]);

    mockDb.select.mockReturnValue({
      from: selectFromMock,
    });

    await seedTripPlannerIfEmpty();

    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('throws an error if required relationships cannot be created', async () => {
    const mockUsersAfterInsert = [
      {
        id: 1,
        name: 'Molly Demo',
        email: 'molly@example.com',
        password: 'password123',
        createdAt: '2026-04-13',
      },
    ];

    const incompleteTrips = [
      {
        id: 1,
        userId: 1,
        title: 'Paris Weekend',
        destination: 'Paris',
        startDate: '2026-05-10',
        endDate: '2026-05-13',
        notes: 'City break with museums and cafes',
      },
    ];

    const incompleteCategories = [
      { id: 1, userId: 1, name: 'Sightseeing', color: '#3B82F6', icon: 'camera' },
    ];

    const selectFromMock = jest
      .fn()
      .mockResolvedValueOnce([]) // existingUsers
      .mockResolvedValueOnce(mockUsersAfterInsert) // seededUsers
      .mockResolvedValueOnce(incompleteTrips) // seededTrips
      .mockResolvedValueOnce(incompleteCategories); // seededCategories

    mockDb.select.mockReturnValue({
      from: selectFromMock,
    });

    const valuesMock = jest.fn().mockResolvedValue(undefined);

    mockDb.insert
      .mockReturnValueOnce({ values: valuesMock })
      .mockReturnValueOnce({ values: valuesMock })
      .mockReturnValueOnce({ values: valuesMock });

    await expect(seedTripPlannerIfEmpty()).rejects.toThrow(
      'Seed data relationships could not be created.'
    );
  });
});