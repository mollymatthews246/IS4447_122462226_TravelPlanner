import { db } from '@/db/client';
import {
  activities as activitiesTable,
  categories as categoriesTable,
  trips as tripsTable,
} from '@/db/schema';
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

export type Activity = {
  id: number;
  tripId: number;
  categoryId: number;
  title: string;
  activityDate: string;
  duration: number;
  count: number;
  notes: string | null;
  status: string;
};

export type Category = {
  id: number;
  userId: number;
  name: string;
  color: string;
  icon: string;
};

type TripPlannerContextType = {
  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
};

export const TripPlannerContext =
  createContext<TripPlannerContextType | null>(null);

export default function RootLayout() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadData = async () => {
      await seedTripPlannerIfEmpty();

      const tripRows = await db.select().from(tripsTable);
      const activityRows = await db.select().from(activitiesTable);
      const categoryRows = await db.select().from(categoriesTable);

      setTrips(tripRows);
      setActivities(activityRows);
      setCategories(categoryRows);
    };

    void loadData();
  }, []);

  return (
    <TripPlannerContext.Provider
      value={{
        trips,
        setTrips,
        activities,
        setActivities,
        categories,
        setCategories,
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </TripPlannerContext.Provider>
  );
}