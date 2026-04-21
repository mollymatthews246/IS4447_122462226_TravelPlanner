import ScreenHeader from '@/components/ui/screen-header';
import { useContext, useMemo, useState } from 'react';
import {
  DimensionValue,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripPlannerContext } from '../../context/trip-planner-context';

type InsightsViewMode = 'daily' | 'weekly' | 'monthly';

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

function getEndOfWeek(date: Date) {
  const end = getStartOfWeek(date);
  end.setDate(end.getDate() + 6);
  return end;
}

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatRangeLabel(
  viewMode: InsightsViewMode,
  rangeStart: string,
  rangeEnd: string
) {
  if (viewMode === 'daily') {
    return `Today • ${rangeStart.split('-').reverse().join('/')}`;
  }

  if (viewMode === 'weekly') {
    const [sy, sm, sd] = rangeStart.split('-');
    const [ey, em, ed] = rangeEnd.split('-');
    return `This Week • ${sd}/${sm}/${sy} - ${ed}/${em}/${ey}`;
  }

  const date = new Date(rangeStart);
  return date.toLocaleDateString('en-IE', {
    month: 'long',
    year: 'numeric',
  });
}

export default function InsightsScreen() {
  const context = useContext(TripPlannerContext);
  const [viewMode, setViewMode] = useState<InsightsViewMode>('monthly');

  if (!context) return null;

  const { activities, categories, trips } = context;
  const today = new Date();

  const rangeStart =
    viewMode === 'daily'
      ? toDateOnly(today)
      : viewMode === 'weekly'
        ? toDateOnly(getStartOfWeek(today))
        : toDateOnly(getStartOfMonth(today));

  const rangeEnd =
    viewMode === 'daily'
      ? toDateOnly(today)
      : viewMode === 'weekly'
        ? toDateOnly(getEndOfWeek(today))
        : toDateOnly(getEndOfMonth(today));

  const completedActivitiesList = activities.filter(
    (activity) => activity.status === 'completed'
  );
  const plannedActivitiesList = activities.filter(
    (activity) => activity.status === 'planned'
  );

  const filteredCompletedActivities = completedActivitiesList.filter(
    (activity) =>
      activity.activityDate >= rangeStart && activity.activityDate <= rangeEnd
  );

  const filteredPlannedActivities = plannedActivitiesList.filter(
    (activity) =>
      activity.activityDate >= rangeStart && activity.activityDate <= rangeEnd
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

  const categoryTotals = useMemo(() => {
    return categories.map((category) => {
      const completedCategoryActivities = filteredCompletedActivities.filter(
        (activity) => activity.categoryId === category.id
      );

      const plannedCategoryActivities = filteredPlannedActivities.filter(
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
  }, [categories, filteredCompletedActivities, filteredPlannedActivities]);

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

  const maxTripHours = Math.max(...tripTotals.map((trip) => trip.completed), 1);

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
          <Text style={styles.sectionTitle}>Hours by Category</Text>

          <View style={styles.segmentedControl}>
            {(['daily', 'weekly', 'monthly'] as InsightsViewMode[]).map((mode) => {
              const isSelected = viewMode === mode;

              return (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${mode} category insights`}
                  onPress={() => setViewMode(mode)}
                  style={[
                    styles.segmentButton,
                    isSelected && styles.segmentButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      isSelected && styles.segmentTextSelected,
                    ]}
                  >
                    {mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.rangeText}>
            {formatRangeLabel(viewMode, rangeStart, rangeEnd)}
          </Text>

          {categoryTotals.every((category) => category.completed === 0) ? (
            <Text style={styles.emptyText}>
              No completed category data available for this period.
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
  segmentedControl: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 3,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    paddingVertical: 8,
  },
  segmentButtonSelected: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  segmentTextSelected: {
    color: '#0F172A',
  },
  rangeText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 12,
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