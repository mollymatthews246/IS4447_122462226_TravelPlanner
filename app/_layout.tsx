import { db } from '@/db/client';
import {
  activities as activitiesTable,
  categories as categoriesTable,
  targets as targetsTable,
  trips as tripsTable,
  users as usersTable,
} from '@/db/schema';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import LoadingScreen from '../components/ui/loading-screen';
import {
  Activity,
  Category,
  Target,
  Trip,
  TripPlannerContext,
  User,
} from '../context/trip-planner-context';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0.1);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

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

  const loadUserData = async (user: User | null) => {
    if (!user) {
      setTrips([]);
      setActivities([]);
      setCategories([]);
      setTargets([]);
      return;
    }

    const tripRows = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.userId, user.id));

    const categoryRows = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.userId, user.id));

    const targetRows = await db
      .select()
      .from(targetsTable)
      .where(eq(targetsTable.userId, user.id));

    const userTripIds = tripRows.map((trip) => trip.id);

    let activityRows: Activity[] = [];

    if (userTripIds.length > 0) {
      const allActivities = await db.select().from(activitiesTable);
      activityRows = allActivities.filter((activity) =>
        userTripIds.includes(activity.tripId)
      );
    }

    setTrips(tripRows);
    setCategories(categoryRows);
    setTargets(targetRows);
    setActivities(activityRows);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingProgress(0.2);
        await delay(250);

        const loggedInUser = await loadUserFromStorage();

        setLoadingProgress(0.6);
        await delay(250);

        await loadUserData(loggedInUser);

        setLoadingProgress(1);
        await delay(700);
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
          return;
        }

        await loadUserData(storedUser);
        return;
      }

      if (currentUser && isAuthPage) {
        router.replace('/');
      }
    };

    void checkAuth();
  }, [currentUser, hasLoaded, pathname]);

  if (!hasLoaded) {
    return <LoadingScreen progress={loadingProgress} />;
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