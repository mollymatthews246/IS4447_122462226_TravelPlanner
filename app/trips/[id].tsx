import WeatherCard from '@/components/WeatherCard';
import { db } from '@/db/client';
import { activities as activitiesTable, trips as tripsTable } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Activity,
  Trip,
  TripPlannerContext,
} from '../../context/trip-planner-context';

function formatShortDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function getDayCount(start: string, end: string): number {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const s = new Date(sy, sm - 1, sd);
  const e = new Date(ey, em - 1, ed);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

function formatActivityDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripPlannerContext);
  const { theme, isDark } = useTheme();

  if (!context) return null;

  const {
    trips,
    setTrips,
    activities,
    setActivities,
    categories,
    currentUser,
  } = context;

  const trip = trips.find((t: Trip) => t.id === Number(id));

  if (!trip) return null;

  const tripActivities = activities.filter(
    (activity: Activity) => activity.tripId === trip.id
  );

  const completedCount = tripActivities.filter(
    (a) => a.status === 'completed'
  ).length;

  const completedHours = tripActivities
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + (a.duration ?? 0), 0);

  const plannedHours = tripActivities
    .filter((a) => a.status === 'planned')
    .reduce((sum, a) => sum + (a.duration ?? 0), 0);

  const deleteTrip = async () => {
    if (!currentUser) return;

    await db.delete(tripsTable).where(eq(tripsTable.id, Number(id)));

    const userTrips = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.userId, currentUser.id));

    setTrips(userTrips);

    const remainingTripIds = userTrips.map((trip) => trip.id);

    const allActivities = await db.select().from(activitiesTable);
    const filteredActivities = allActivities.filter((activity) =>
      remainingTripIds.includes(activity.tripId)
    );

    setActivities(filteredActivities);

    router.back();
  };

  const markActivityComplete = async (activityId: number) => {
    await db
      .update(activitiesTable)
      .set({ status: 'completed' })
      .where(eq(activitiesTable.id, activityId));

    const currentTripIds = trips.map((trip) => trip.id);

    const allActivities = await db.select().from(activitiesTable);
    const filteredActivities = allActivities.filter((activity) =>
      currentTripIds.includes(activity.tripId)
    );

    setActivities(filteredActivities);
  };

  const confirmMarkComplete = (activityId: number, title: string) => {
    Alert.alert('Mark activity complete', `Mark "${title}" as completed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => {
          void markActivityComplete(activityId);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.topBarButton, { backgroundColor: theme.card }]}
          >
            <Text style={styles.topBarIcon}>‹</Text>
          </Pressable>

          <View style={styles.topBarRight}>
            <Pressable
              onPress={() => router.push(`/trips/${id}/edit`)}
              style={[styles.topBarButton, { backgroundColor: theme.card }]}
            >
              <Text style={styles.topBarIcon}>✎</Text>
            </Pressable>

            <Pressable
              onPress={deleteTrip}
              style={[styles.topBarButton, { backgroundColor: theme.card }]}
            >
              <Text style={styles.topBarIcon}>🗑</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.destinationBadge}>
          <Text style={styles.destinationPin}>📍</Text>
          <Text style={styles.destinationText}>
            {trip.destination.toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.tripTitle, { color: theme.text }]}>{trip.title}</Text>

        <View style={styles.dateRow}>
          <Text style={styles.dateIcon}>📅</Text>
          <View>
            <Text style={[styles.dateLabel, { color: theme.secondaryText }]}>
              DATES
            </Text>
            <Text style={[styles.dateValue, { color: theme.text }]}>
              {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)}
            </Text>
          </View>

          <View style={[styles.dateDivider, { backgroundColor: theme.border }]} />

          <View>
            <Text style={[styles.dateLabel, { color: theme.secondaryText }]}>
              DURATION
            </Text>
            <Text style={[styles.dateValue, { color: theme.text }]}>
              {getDayCount(trip.startDate, trip.endDate)} days
            </Text>
          </View>
        </View>

        {trip.notes ? (
          <View
            style={[
              styles.notesCard,
              { backgroundColor: theme.card, shadowOpacity: isDark ? 0 : 0.05 },
            ]}
          >
            <Text style={styles.notesQuote}>"</Text>
            <Text style={[styles.notesText, { color: theme.secondaryText }]}>
              {trip.notes}
            </Text>
          </View>
        ) : null}

        <WeatherCard destination={trip.destination} />

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.card, shadowOpacity: isDark ? 0 : 0.05 },
            ]}
          >
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {tripActivities.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
              ACTIVITIES
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.card, shadowOpacity: isDark ? 0 : 0.05 },
            ]}
          >
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {completedCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
              COMPLETED
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.card, shadowOpacity: isDark ? 0 : 0.05 },
            ]}
          >
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {completedHours}h
            </Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
              DONE
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.card, shadowOpacity: isDark ? 0 : 0.05 },
            ]}
          >
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {plannedHours}h
            </Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
              PLANNED
            </Text>
          </View>
        </View>

        <View style={styles.activitiesHeader}>
          <Text style={[styles.activitiesTitle, { color: theme.text }]}>
            Activities
          </Text>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push(`/activities/add?tripId=${trip.id}`)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>

        {tripActivities.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.card, shadowOpacity: isDark ? 0 : 0.05 },
            ]}
          >
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
              No activities added yet. Add your first activity for this trip.
            </Text>
          </View>
        ) : (
          tripActivities.map((activity) => {
            const category = categories.find(
              (cat) => cat.id === activity.categoryId
            );
            const borderColor = category?.color ?? theme.border;
            const isCompleted = activity.status === 'completed';

            return (
              <Pressable
                key={activity.id}
                style={[
                  styles.activityCard,
                  {
                    backgroundColor: theme.card,
                    borderLeftColor: borderColor,
                    shadowOpacity: isDark ? 0 : 0.05,
                  },
                ]}
                onPress={() => router.push(`/activities/${activity.id}/edit`)}
              >
                <View style={styles.activityTop}>
                  <Text style={[styles.activityTitle, { color: theme.text }]}>
                    {activity.title}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isCompleted ? '#ECFDF5' : '#FFF7ED',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: isCompleted ? '#22C55E' : '#F97316',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: isCompleted ? '#16A34A' : '#EA580C',
                        },
                      ]}
                    >
                      {isCompleted ? 'Completed' : 'Planned'}
                    </Text>
                  </View>
                </View>

                <View style={styles.activityMeta}>
                  <Text style={[styles.metaText, { color: theme.secondaryText }]}>
                    📅 {formatActivityDate(activity.activityDate)}
                  </Text>
                  <Text style={[styles.metaText, { color: theme.secondaryText }]}>
                    ⏱ {activity.duration}h
                  </Text>
                  {category ? (
                    <Text style={[styles.metaText, { color: theme.secondaryText }]}>
                      {category.icon} {category.name}
                    </Text>
                  ) : null}
                </View>

                {activity.notes ? (
                  <View
                    style={[
                      styles.activityNotesBar,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.activityNotesText,
                        { color: theme.secondaryText },
                      ]}
                    >
                      {activity.notes}
                    </Text>
                  </View>
                ) : null}

                {!isCompleted ? (
                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.completeButton}
                      onPress={(event) => {
                        event.stopPropagation();
                        confirmMarkComplete(activity.id, activity.title);
                      }}
                    >
                      <Text style={styles.completeButtonText}>Mark Complete</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.completedRow}>
                    <Text style={styles.completedText}>Completed ✅</Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  topBarRight: {
    flexDirection: 'row',
  },
  topBarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 40,
    width: 40,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  topBarIcon: {
    fontSize: 18,
  },
  destinationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1EC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  destinationPin: {
    fontSize: 12,
    marginRight: 4,
  },
  destinationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
    letterSpacing: 0.5,
  },
  tripTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 16,
  },
  notesCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  notesQuote: {
    fontSize: 32,
    color: '#D4A574',
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activitiesTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activityCard: {
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  activityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    marginRight: 14,
    marginBottom: 4,
  },
  activityNotesBar: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  activityNotesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  completeButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  completedRow: {
    marginTop: 10,
  },
  completedText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});