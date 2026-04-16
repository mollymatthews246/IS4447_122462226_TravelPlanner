import { db } from '@/db/client';
import {
  activities as activitiesTable,
  categories as categoriesTable,
  targets as targetsTable,
  trips as tripsTable,
  users as usersTable,
} from '@/db/schema';
import { seedTripPlannerIfEmpty } from '@/db/seed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { Stack, usePathname, useRouter } from 'expo-router';
import { createContext, useEffect, useState } from 'react';

export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: string;
};

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

export type Target = {
  id: number;
  userId: number;
  tripId: number | null;
  categoryId: number | null;
  type: string;
  metricType: string;
  targetValue: number;
  startDate: string;
  endDate: string;
};

type TripPlannerContextType = {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;

  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;

  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;

  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;

  targets: Target[];
  setTargets: React.Dispatch<React.SetStateAction<Target[]>>;
};

export const TripPlannerContext =
  createContext<TripPlannerContextType | null>(null);

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);

  const loadUserFromStorage = async () => {
    const storedUserId = await AsyncStorage.getItem('loggedInUserId');

    console.log('STORED USER ID IN LAYOUT:', storedUserId);

    if (!storedUserId) {
      setCurrentUser(null);
      return null;
    }

    const userRows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, Number(storedUserId)));

    if (userRows.length > 0) {
      setCurrentUser(userRows[0]);
      console.log('CURRENT USER LOADED:', userRows[0]);
      return userRows[0];
    }

    await AsyncStorage.removeItem('loggedInUserId');
    setCurrentUser(null);
    return null;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await seedTripPlannerIfEmpty();

        await loadUserFromStorage();

        const tripRows = await db.select().from(tripsTable);
        const activityRows = await db.select().from(activitiesTable);
        const categoryRows = await db.select().from(categoriesTable);
        const targetRows = await db.select().from(targetsTable);

        setTrips(tripRows);
        setActivities(activityRows);
        setCategories(categoryRows);
        setTargets(targetRows);
      } catch (error) {
        console.log('LOAD DATA ERROR:', error);
      } finally {
        setHasLoaded(true);
      }
    };

    void loadData();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!hasLoaded) return;

      const isAuthPage = pathname === '/login' || pathname === '/register';

      console.log('PATHNAME:', pathname);
      console.log('CURRENT USER:', currentUser);

      if (!currentUser && !isAuthPage) {
        const storedUser = await loadUserFromStorage();

        if (!storedUser) {
          router.replace('/login');
        }

        return;
      }

      if (currentUser && isAuthPage) {
        router.replace('/');
      }
    };

    void checkAuth();
  }, [currentUser, hasLoaded, pathname]);

  if (!hasLoaded) {
    return null;
  }

  return (
    <TripPlannerContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        trips,
        setTrips,
        activities,
        setActivities,
        categories,
        setCategories,
        targets,
        setTargets,
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </TripPlannerContext.Provider>
  );
}