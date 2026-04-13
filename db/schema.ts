import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: text('created_at').notNull(),
});

export const trips = sqliteTable('trips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(),
  destination: text('destination').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  notes: text('notes'),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
});

export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').notNull(),
  categoryId: integer('category_id').notNull(),
  title: text('title').notNull(),
  activityDate: text('activity_date').notNull(),
  duration: integer('duration').notNull().default(0),
  count: integer('count').notNull().default(1),
  notes: text('notes'),
  status: text('status').notNull().default('planned'),
});

export const targets = sqliteTable('targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  tripId: integer('trip_id'),
  categoryId: integer('category_id'),
  type: text('type').notNull(), // weekly or monthly
  metricType: text('metric_type').notNull(), // duration or count
  targetValue: integer('target_value').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
});