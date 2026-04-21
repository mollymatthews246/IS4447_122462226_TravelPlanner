import { Colors } from '@/constants/theme';
import { db } from '@/db/client';
import { activities as activitiesTable, trips as tripsTable } from '@/db/schema';
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

  if (!context) return null;

  const { trips, setTrips, activities, setActivities, categories } = context;
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
    await db.delete(tripsTable).where(eq(tripsTable.id, Number(id)));
    const rows = await db.select().from(tripsTable);
    setTrips(rows);
    router.back();
  };

  const markActivityComplete = async (activityId: number) => {
    await db
      .update(activitiesTable)
      .set({ status: 'completed' })
      .where(eq(activitiesTable.id, activityId));

    const rows = await db.select().from(activitiesTable);
    setActivities(rows);
  };

  const confirmMarkComplete = (activityId: number, title: string) => {
    Alert.alert(
      'Mark activity complete',
      `Mark "${title}" as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            void markActivityComplete(activityId);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.topBarButton}>
            <Text style={styles.topBarIcon}>‹</Text>
          </Pressable>
          <View style={styles.topBarRight}>
            <Pressable
              onPress={() => router.push(`/trips/${id}/edit`)}
              style={styles.topBarButton}
            >
              <Text style={styles.topBarIcon}>✎</Text>
            </Pressable>
            <Pressable onPress={deleteTrip} style={styles.topBarButton}>
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

        <Text style={styles.tripTitle}>{trip.title}</Text>

        <View style={styles.dateRow}>
          <Text style={styles.dateIcon}>📅</Text>
          <View>
            <Text style={styles.dateLabel}>DATES</Text>
            <Text style={styles.dateValue}>
              {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)}
            </Text>
          </View>
          <View style={styles.dateDivider} />
          <View>
            <Text style={styles.dateLabel}>DURATION</Text>
            <Text style={styles.dateValue}>
              {getDayCount(trip.startDate, trip.endDate)} days
            </Text>
          </View>
        </View>

        {trip.notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesQuote}>"</Text>
            <Text style={styles.notesText}>{trip.notes}</Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{tripActivities.length}</Text>
            <Text style={styles.statLabel}>ACTIVITIES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>COMPLETED</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedHours}h</Text>
            <Text style={styles.statLabel}>DONE</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{plannedHours}h</Text>
            <Text style={styles.statLabel}>PLANNED</Text>
          </View>
        </View>

        <View style={styles.activitiesHeader}>
          <Text style={styles.activitiesTitle}>Activities</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push(`/activities/add?tripId=${trip.id}`)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>

        {tripActivities.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No activities added yet. Add your first activity for this trip.
            </Text>
          </View>
        ) : (
          tripActivities.map((activity) => {
            const category = categories.find(
              (cat) => cat.id === activity.categoryId
            );
            const borderColor = category?.color ?? '#CBD5E1';
            const isCompleted = activity.status === 'completed';

            return (
              <Pressable
                key={activity.id}
                style={[
                  styles.activityCard,
                  { borderLeftColor: borderColor },
                ]}
                onPress={() => router.push(`/activities/${activity.id}/edit`)}
              >
                <View style={styles.activityTop}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
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
                  <Text style={styles.metaText}>
                    📅 {formatActivityDate(activity.activityDate)}
                  </Text>
                  <Text style={styles.metaText}>⏱ {activity.duration}h</Text>
                  {category ? (
                    <Text style={styles.metaText}>
                      {category.icon} {category.name}
                    </Text>
                  ) : null}
                </View>

                {activity.notes ? (
                  <View style={styles.activityNotesBar}>
                    <Text style={styles.activityNotesText}>
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
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#FFFFFF',
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
    color: Colors.light.text,
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
    color: Colors.light.icon,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  dateDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
    color: '#475569',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.icon,
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
    color: Colors.light.text,
  },
  addButton: {
    backgroundColor: Colors.light.tint,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
    color: Colors.light.text,
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
    color: Colors.light.icon,
    marginRight: 14,
    marginBottom: 4,
  },
  activityNotesBar: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  activityNotesText: {
    fontSize: 13,
    color: '#64748B',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyText: {
    color: Colors.light.icon,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});