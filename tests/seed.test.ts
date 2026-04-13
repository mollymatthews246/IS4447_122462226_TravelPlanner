import { seedStudentsIfEmpty } from '../db/seed';
import { db } from '../db/client';

jest.mock('../db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

const mockDb = db as unknown as { select: jest.Mock; insert: jest.Mock };

describe('seedStudentsIfEmpty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts students when the table is empty', async () => {
    const mockValues = jest.fn().mockResolvedValue(undefined);
    const mockFrom = jest.fn().mockResolvedValue([]);
    mockDb.select.mockReturnValue({ from: mockFrom });
    mockDb.insert.mockReturnValue({ values: mockValues });

    await seedStudentsIfEmpty();

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Emilia' }),
        expect.objectContaining({ name: 'Jackie' }),
        expect.objectContaining({ name: 'Sammy' }),
      ])
    );
  });

  it('does nothing when students already exist', async () => {
    const mockFrom = jest.fn().mockResolvedValue([
      { id: 1, name: 'Existing', major: 'CS', year: '1', count: 0 },
    ]);
    mockDb.select.mockReturnValue({ from: mockFrom });

    await seedStudentsIfEmpty();

    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
