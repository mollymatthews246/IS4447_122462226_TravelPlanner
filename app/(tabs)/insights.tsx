import ScreenHeader from '@/components/ui/screen-header';
import { useContext } from 'react';
import {
  DimensionValue,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripPlannerContext } from '../../context/trip-planner-context';

function formatIrishDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export default function InsightsScreen() {
  const context = useContext(TripPlannerContext);

  if (!context) return null;

  const { activities, categories, trips } = context;

  const totalActivities = activities.length;

  const totalHours = activities.reduce(
    (total, activity) => total + activity.duration,
    0
  );

  const completedActivities = activities.filter(
    (activity) => activity.status === 'completed'
  ).length;

  const plannedActivities = activities.filter(
    (activity) => activity.status === 'planned'
  ).length;

  const categoryTotals = categories.map((category) => {
    const categoryActivities = activities.filter(
      (activity) => activity.categoryId === category.id
    );

    const hours = categoryActivities.reduce(
      (total, activity) => total + activity.duration,
      0
    );

    return {
      id: category.id,
      name: category.name,
      color: category.color,
      hours,
      count: categoryActivities.length,
    };
  });

  const maxCategoryHours = Math.max(
    ...categoryTotals.map((category) => category.hours),
    1
  );

  const dailyTotals = activities.reduce<Record<string, number>>(
    (totals, activity) => {
      totals[activity.activityDate] =
        (totals[activity.activityDate] ?? 0) + activity.duration;

      return totals;
    },
    {}
  );

  const dailyEntries = Object.entries(dailyTotals).sort(
    ([dateA], [dateB]) => dateA.localeCompare(dateB)
  );

  const maxDailyHours = Math.max(
    ...dailyEntries.map(([, hours]) => hours),
    1
  );

  const tripTotals = trips.map((trip) => {
    const tripActivities = activities.filter(
      (activity) => activity.tripId === trip.id
    );

    const hours = tripActivities.reduce(
      (total, activity) => total + activity.duration,
      0
    );

    return {
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      hours,
      count: tripActivities.length,
    };
  });

  const maxTripHours = Math.max(
    ...tripTotals.map((trip) => trip.hours),
    1
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Insights"
        subtitle="Understand your trip activity balance"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalActivities}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalHours}</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedActivities}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{plannedActivities}</Text>
            <Text style={styles.statLabel}>Planned</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hours by Category</Text>

          {categoryTotals.every((category) => category.hours === 0) ? (
            <Text style={styles.emptyText}>
              No category activity data available yet.
            </Text>
          ) : (
            categoryTotals
              .filter((category) => category.hours > 0)
              .map((category) => {
                const width = `${Math.max(
                  (category.hours / maxCategoryHours) * 100,
                  8
                )}%` as DimensionValue;

                return (
                  <View key={category.id} style={styles.chartRow}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartLabel}>{category.name}</Text>
                      <Text style={styles.chartValue}>
                        {category.hours} hrs
                      </Text>
                    </View>

                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width,
                            backgroundColor: category.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Activity Hours</Text>

          {dailyEntries.length === 0 ? (
            <Text style={styles.emptyText}>No activity data available yet.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calendarChart}
            >
              {dailyEntries.map(([date, hours]) => {
                const height = Math.max((hours / maxDailyHours) * 120, 12);

                return (
                  <View key={date} style={styles.calendarBarItem}>
                    <Text style={styles.calendarValue}>{hours}</Text>

                    <View style={styles.calendarBarTrack}>
                      <View style={[styles.calendarBarFill, { height }]} />
                    </View>

                    <Text style={styles.calendarLabel}>
                      {formatIrishDate(date).slice(0, 5)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hours by Trip</Text>

          {tripTotals.every((trip) => trip.hours === 0) ? (
            <Text style={styles.emptyText}>
              No trip activity data available yet.
            </Text>
          ) : (
            tripTotals
              .filter((trip) => trip.hours > 0)
              .map((trip) => {
                const width = `${Math.max(
                  (trip.hours / maxTripHours) * 100,
                  8
                )}%` as DimensionValue;

                return (
                  <View key={trip.id} style={styles.chartRow}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartLabel}>{trip.title}</Text>
                      <Text style={styles.chartValue}>{trip.hours} hrs</Text>
                    </View>

                    <Text style={styles.tripDestination}>
                      {trip.destination} • {trip.count} activities
                    </Text>

                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width }]} />
                    </View>
                  </View>
                );
              })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  content: {
    paddingBottom: 24,
    paddingTop: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexGrow: 1,
    padding: 14,
    width: '47%',
  },
  statValue: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 14,
    padding: 14,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  chartRow: {
    marginBottom: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chartLabel: {
    color: '#334155',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  chartValue: {
    color: '#64748B',
    fontSize: 14,
  },
  tripDestination: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 6,
  },
  barTrack: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    height: 12,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: '#22C55E',
    borderRadius: 999,
    height: '100%',
  },
  calendarChart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 14,
    minHeight: 170,
    paddingHorizontal: 4,
    paddingTop: 12,
  },
  calendarBarItem: {
    alignItems: 'center',
    width: 46,
  },
  calendarValue: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  calendarBarTrack: {
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    height: 120,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 18,
  },
  calendarBarFill: {
    backgroundColor: '#3B82F6',
    borderRadius: 999,
    width: '100%',
  },
  calendarLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 6,
  },
});