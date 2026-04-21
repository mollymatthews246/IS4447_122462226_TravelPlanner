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

export default function InsightsScreen() {
  const context = useContext(TripPlannerContext);

  if (!context) return null;

  const { activities, categories, trips } = context;

  const completedActivitiesList = activities.filter(
    (activity) => activity.status === 'completed'
  );
  const plannedActivitiesList = activities.filter(
    (activity) => activity.status === 'planned'
  );

  const totalActivities = activities.length;
  const completedActivities = completedActivitiesList.length;
  const plannedActivities = plannedActivitiesList.length;

  const completedHours = completedActivitiesList.reduce(
    (total, activity) => total + activity.duration,
    0
  );

  const plannedHours = plannedActivitiesList.reduce(
    (total, activity) => total + activity.duration,
    0
  );

  const totalHours = completedHours + plannedHours;

  const categoryTotals = categories.map((category) => {
    const completedCategoryActivities = completedActivitiesList.filter(
      (activity) => activity.categoryId === category.id
    );

    const plannedCategoryActivities = plannedActivitiesList.filter(
      (activity) => activity.categoryId === category.id
    );

    const completed = completedCategoryActivities.reduce(
      (total, activity) => total + activity.duration,
      0
    );

    const planned = plannedCategoryActivities.reduce(
      (total, activity) => total + activity.duration,
      0
    );

    return {
      id: category.id,
      name: category.name,
      color: category.color,
      completed,
      planned,
      total: completed + planned,
    };
  });

  const maxCategoryHours = Math.max(
    ...categoryTotals.map((category) => category.completed),
    1
  );

  const tripTotals = trips.map((trip) => {
    const completedTripActivities = completedActivitiesList.filter(
      (activity) => activity.tripId === trip.id
    );

    const plannedTripActivities = plannedActivitiesList.filter(
      (activity) => activity.tripId === trip.id
    );

    const completed = completedTripActivities.reduce(
      (total, activity) => total + activity.duration,
      0
    );

    const planned = plannedTripActivities.reduce(
      (total, activity) => total + activity.duration,
      0
    );

    return {
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      completed,
      planned,
      total: completed + planned,
      activityCount:
        completedTripActivities.length + plannedTripActivities.length,
    };
  });

  const maxTripHours = Math.max(
    ...tripTotals.map((trip) => trip.completed),
    1
  );

  const completionPercentage =
    totalHours === 0 ? 0 : Math.round((completedHours / totalHours) * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Insights"
        subtitle="See how your plans and completed activities compare"
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
            <Text style={styles.statValue}>{completedHours}</Text>
            <Text style={styles.statLabel}>Completed Hours</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{plannedHours}</Text>
            <Text style={styles.statLabel}>Planned Hours</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Progress</Text>

          <View style={styles.progressSummaryRow}>
            <View style={styles.progressSummaryCard}>
              <Text style={styles.progressSummaryValue}>
                {completedActivities}
              </Text>
              <Text style={styles.progressSummaryLabel}>Completed</Text>
            </View>

            <View style={styles.progressSummaryCard}>
              <Text style={styles.progressSummaryValue}>{plannedActivities}</Text>
              <Text style={styles.progressSummaryLabel}>Planned</Text>
            </View>

            <View style={styles.progressSummaryCard}>
              <Text style={styles.progressSummaryValue}>
                {completionPercentage}%
              </Text>
              <Text style={styles.progressSummaryLabel}>Completion</Text>
            </View>
          </View>

          <Text style={styles.progressBreakdownText}>
            Completed hours count toward your target progress. Planned hours show
            what is still scheduled.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed Hours by Category</Text>

          {categoryTotals.every((category) => category.completed === 0) ? (
            <Text style={styles.emptyText}>
              No completed category data available yet.
            </Text>
          ) : (
            categoryTotals
              .filter((category) => category.completed > 0)
              .map((category) => {
                const width = `${Math.max(
                  (category.completed / maxCategoryHours) * 100,
                  8
                )}%` as DimensionValue;

                return (
                  <View key={category.id} style={styles.chartRow}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartLabel}>{category.name}</Text>
                      <Text style={styles.chartValue}>
                        {category.completed} hrs
                      </Text>
                    </View>

                    <Text style={styles.secondaryLine}>
                      {category.planned > 0
                        ? `${category.planned} planned hrs still upcoming`
                        : 'No planned hours remaining'}
                    </Text>

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
          <Text style={styles.sectionTitle}>Trip Progress</Text>

          {tripTotals.every((trip) => trip.total === 0) ? (
            <Text style={styles.emptyText}>
              No trip activity data available yet.
            </Text>
          ) : (
            tripTotals
              .filter((trip) => trip.total > 0)
              .map((trip) => {
                const width = `${Math.max(
                  (trip.completed / maxTripHours) * 100,
                  8
                )}%` as DimensionValue;

                return (
                  <View key={trip.id} style={styles.chartRow}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartLabel}>{trip.title}</Text>
                      <Text style={styles.chartValue}>
                        {trip.completed} hrs done
                      </Text>
                    </View>

                    <Text style={styles.tripDestination}>
                      {trip.destination} • {trip.activityCount} activities •{' '}
                      {trip.planned} planned hrs
                    </Text>

                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width }]} />
                    </View>
                  </View>
                );
              })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destination List</Text>

          {trips.length === 0 ? (
            <Text style={styles.emptyText}>No trips added yet.</Text>
          ) : (
            trips.map((trip) => (
              <View key={trip.id} style={styles.destinationRow}>
                <Text style={styles.destinationPin}>📍</Text>
                <View style={styles.destinationTextBlock}>
                  <Text style={styles.destinationTitle}>{trip.destination}</Text>
                  <Text style={styles.destinationSubtitle}>{trip.title}</Text>
                </View>
              </View>
            ))
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
  progressSummaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  progressSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  progressSummaryValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  progressSummaryLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  progressBreakdownText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  chartRow: {
    marginBottom: 14,
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
  secondaryLine: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 6,
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
  destinationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  destinationPin: {
    fontSize: 18,
    marginRight: 10,
  },
  destinationTextBlock: {
    flex: 1,
  },
  destinationTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  destinationSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
  },
});