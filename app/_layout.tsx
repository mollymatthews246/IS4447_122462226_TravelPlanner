import { db } from '@/db/client';
import { trips as tripsTable } from '@/db/schema';
import { seedTripPlannerIfEmpty } from '@/db/seed';
import { Stack } from 'expo-router';
import { createContext, useEffect, useState } from 'react';

export type Trip = {
  id: number;
  userId: number;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string | null;
};

type TripPlannerContextType = {
  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
};

export const TripPlannerContext =
  createContext<TripPlannerContextType | null>(null);

export default function RootLayout() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const loadTrips = async () => {
      await seedTripPlannerIfEmpty();
      const rows = await db.select().from(tripsTable);
      setTrips(rows);
    };

    void loadTrips();
  }, []);

  return (
  <TripPlannerContext.Provider value={{ trips, setTrips }}>
    <Stack screenOptions={{ headerShown: false }} />
  </TripPlannerContext.Provider>
  );
}