/// <reference types="jest" />
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import IndexScreen from '../app/(tabs)/index';
import { TripPlannerContext } from '../context/trip-planner-context';

jest.mock('../db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

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
];

describe('Trips list integration', () => {
  it('displays seeded trip data from context on the main list screen', async () => {
    const { getByText, getAllByText } = render(
      <TripPlannerContext.Provider
        value={{
          currentUser: {
            id: 1,
            name: 'Molly Demo',
            email: 'molly@example.com',
            password: 'password123',
            createdAt: '2026-04-13',
          },
          setCurrentUser: jest.fn(),
          trips: mockTrips,
          setTrips: jest.fn(),
          activities: [],
          setActivities: jest.fn(),
          categories: [],
          setCategories: jest.fn(),
          targets: [],
          setTargets: jest.fn(),
        }}
      >
        <IndexScreen />
      </TripPlannerContext.Provider>
    );

    await waitFor(() => {
      expect(getByText('Paris Weekend')).toBeTruthy();
      expect(getByText('Italy Summer Trip')).toBeTruthy();
      expect(getAllByText('Paris').length).toBeGreaterThan(0);
      expect(getAllByText('Rome').length).toBeGreaterThan(0);
      expect(getByText('Add Trip')).toBeTruthy();
    });
  });
});