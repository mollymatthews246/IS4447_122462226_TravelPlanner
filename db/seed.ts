// Development data seeding script for Trip Planner app
import { db } from './client';
import { activities, categories, targets, trips, users } from './schema';

export async function seedTripPlannerIfEmpty() {
  const existingUsers = await db.select().from(users);

  if (existingUsers.length > 0) {
    return;
  }

  await db.insert(users).values([
    {
      name: 'Molly Demo',
      email: 'molly@example.com',
      password: 'password123',
      createdAt: '2026-04-13',
    },
  ]);

  const seededUsers = await db.select().from(users);
  const userId = seededUsers[0].id;

  await db.insert(trips).values([
    {
      userId,
      title: 'Paris Weekend',
      destination: 'Paris',
      startDate: '2026-05-10',
      endDate: '2026-05-13',
      notes: 'City break with museums and cafes',
    },
    {
      userId,
      title: 'Italy Summer Trip',
      destination: 'Rome',
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      notes: 'Food, history and sightseeing',
    },
    {
      userId,
      title: 'Adventure in Kerry',
      destination: 'Kerry',
      startDate: '2026-07-05',
      endDate: '2026-07-09',
      notes: 'Nature and outdoor activities',
    },
  ]);

  await db.insert(categories).values([
    {
      userId,
      name: 'Sightseeing',
      color: '#3B82F6',
      icon: 'camera',
    },
    {
      userId,
      name: 'Outdoor',
      color: '#22C55E',
      icon: 'tree',
    },
    {
      userId,
      name: 'Food',
      color: '#F97316',
      icon: 'utensils',
    },
    {
      userId,
      name: 'Relaxation',
      color: '#A855F7',
      icon: 'coffee',
    },
    {
      userId,
      name: 'Shopping',
      color: '#EC4899',
      icon: 'shopping-bag',
    },
    {
      userId,
      name: 'Transport',
      color: '#6366F1',
      icon: 'bus',
    },
    {
      userId,
      name: 'Culture',
      color: '#EAB308',
      icon: 'landmark',
    },
    {
      userId,
      name: 'Nightlife',
      color: '#8B5CF6',
      icon: 'music',
    },
  ]);
  const seededTrips = await db.select().from(trips);
  const seededCategories = await db.select().from(categories);

  const parisTrip = seededTrips.find((trip) => trip.title === 'Paris Weekend');
  const italyTrip = seededTrips.find((trip) => trip.title === 'Italy Summer Trip');
  const kerryTrip = seededTrips.find((trip) => trip.title === 'Adventure in Kerry');

  const sightseeingCategory = seededCategories.find(
    (category) => category.name === 'Sightseeing'
  );
  const outdoorCategory = seededCategories.find(
    (category) => category.name === 'Outdoor'
  );
  const foodCategory = seededCategories.find((category) => category.name === 'Food');
  const relaxationCategory = seededCategories.find(
    (category) => category.name === 'Relaxation'
  );

  if (
    !parisTrip ||
    !italyTrip ||
    !kerryTrip ||
    !sightseeingCategory ||
    !outdoorCategory ||
    !foodCategory ||
    !relaxationCategory
  ) {
    throw new Error('Seed data relationships could not be created.');
  }

  await db.insert(activities).values([
    {
      tripId: parisTrip.id,
      categoryId: sightseeingCategory.id,
      title: 'Eiffel Tower visit',
      activityDate: '2026-05-10',
      duration: 2,
      count: 1,
      notes: 'Evening visit',
      status: 'completed',
    },
    {
      tripId: parisTrip.id,
      categoryId: foodCategory.id,
      title: 'Dinner by the Seine',
      activityDate: '2026-05-10',
      duration: 2,
      count: 1,
      notes: 'French restaurant booking',
      status: 'planned',
    },
    {
      tripId: parisTrip.id,
      categoryId: sightseeingCategory.id,
      title: 'Louvre Museum',
      activityDate: '2026-05-11',
      duration: 3,
      count: 1,
      notes: 'Morning entry',
      status: 'planned',
    },
    {
      tripId: italyTrip.id,
      categoryId: sightseeingCategory.id,
      title: 'Colosseum tour',
      activityDate: '2026-06-16',
      duration: 3,
      count: 1,
      notes: 'Guided tour',
      status: 'planned',
    },
    {
      tripId: italyTrip.id,
      categoryId: foodCategory.id,
      title: 'Pasta making class',
      activityDate: '2026-06-17',
      duration: 2,
      count: 1,
      notes: 'Cooking experience',
      status: 'planned',
    },
    {
      tripId: italyTrip.id,
      categoryId: relaxationCategory.id,
      title: 'Spa afternoon',
      activityDate: '2026-06-18',
      duration: 2,
      count: 1,
      notes: 'Hotel spa',
      status: 'planned',
    },
    {
      tripId: kerryTrip.id,
      categoryId: outdoorCategory.id,
      title: 'Mountain hike',
      activityDate: '2026-07-06',
      duration: 4,
      count: 1,
      notes: 'Bring waterproof gear',
      status: 'planned',
    },
    {
      tripId: kerryTrip.id,
      categoryId: outdoorCategory.id,
      title: 'Bike rental',
      activityDate: '2026-07-07',
      duration: 2,
      count: 1,
      notes: 'Cycle route near national park',
      status: 'planned',
    },
  ]);

  await db.insert(targets).values([
    {
      userId,
      tripId: parisTrip.id,
      categoryId: sightseeingCategory.id,
      type: 'weekly',
      metricType: 'duration',
      targetValue: 5,
      startDate: '2026-05-10',
      endDate: '2026-05-16',
    },
    {
      userId,
      tripId: italyTrip.id,
      categoryId: foodCategory.id,
      type: 'weekly',
      metricType: 'count',
      targetValue: 2,
      startDate: '2026-06-15',
      endDate: '2026-06-21',
    },
    {
      userId,
      tripId: kerryTrip.id,
      categoryId: outdoorCategory.id,
      type: 'monthly',
      metricType: 'duration',
      targetValue: 6,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    },
  ]);
}