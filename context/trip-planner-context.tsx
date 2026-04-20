import { createContext } from 'react';

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

export type TripPlannerContextType = {
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