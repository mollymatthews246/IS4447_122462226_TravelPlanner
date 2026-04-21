import ScreenHeader from '@/components/ui/screen-header';
import { useTheme } from '@/hooks/useTheme';
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

  const [year, month] = rangeStart.split('-').map(Number);
  const date = new Date(year, month - 1, 1);

  return date.toLocaleDateString('en-IE', {
    month: 'long',
    year: 'numeric',
  });
}

export default function InsightsScreen() {
  const context = useContext(TripPlannerContext);
  const { theme, isDark } = useTheme();
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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScreenHeader
        title="Insights"
        subtitle="See how your plans and completed activities compare"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: theme.text }]}>
              {totalActivities}
            </Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
              Activities
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: theme.text }]}>
              {totalHours}
            </Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
              Total Hours
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: theme.text }]}>
              {completedHours}
            </Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
              Completed Hours
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: theme.text }]}>
              {plannedHours}
            </Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
              Planned Hours
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Activity Progress
          </Text>

          <View style={styles.progressSummaryRow}>
            <View
              style={[
                styles.progressSummaryCard,
                { backgroundColor: theme.inputBackground },
              ]}
            >
              <Text
                style={[styles.progressSummaryValue, { color: theme.text }]}
              >
                {completedActivities}
              </Text>
              <Text
                style={[
                  styles.progressSummaryLabel,
                  { color: theme.secondaryText },
                ]}
              >
                Completed
              </Text>
            </View>

            <View
              style={[
                styles.progressSummaryCard,
                { backgroundColor: theme.inputBackground },
              ]}
            >
              <Text
                style={[styles.progressSummaryValue, { color: theme.text }]}
              >
                {plannedActivities}
              </Text>
              <Text
                style={[
                  styles.progressSummaryLabel,
                  { color: theme.secondaryText },
                ]}
              >
                Planned
              </Text>
            </View>

            <View
              style={[
                styles.progressSummaryCard,
                { backgroundColor: theme.inputBackground },
              ]}
            >
              <Text
                style={[styles.progressSummaryValue, { color: theme.text }]}
              >
                {completionPercentage}%
              </Text>
              <Text
                style={[
                  styles.progressSummaryLabel,
                  { color: theme.secondaryText },
                ]}
              >
                Completion
              </Text>
            </View>
          </View>

          <Text
            style={[styles.progressBreakdownText, { color: theme.secondaryText }]}
          >
            Completed hours count toward your target progress. Planned hours show
            what is still scheduled.
          </Text>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Hours by Category
          </Text>

          <View
            style={[
              styles.segmentedControl,
              {
                backgroundColor: theme.muted,
                borderColor: theme.border,
              },
            ]}
          >
            {(['daily', 'weekly', 'monthly'] as InsightsViewMode[]).map(
              (mode) => {
                const isSelected = viewMode === mode;

                return (
                  <Pressable
                    key={mode}
                    accessibilityRole="button"
                    accessibilityLabel={`Show ${mode} category insights`}
                    onPress={() => setViewMode(mode)}
                    style={[
                      styles.segmentButton,
                      isSelected && [
                        styles.segmentButtonSelected,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: isSelected ? theme.text : theme.secondaryText },
                      ]}
                    >
                      {mode}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>

          <Text style={[styles.rangeText, { color: theme.secondaryText }]}>
            {formatRangeLabel(viewMode, rangeStart, rangeEnd)}
          </Text>

          {categoryTotals.every((category) => category.completed === 0) ? (
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
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
                      <Text style={[styles.chartLabel, { color: theme.text }]}>
                        {category.name}
                      </Text>
                      <Text
                        style={[styles.chartValue, { color: theme.secondaryText }]}
                      >
                        {category.completed} hrs
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.secondaryLine,
                        { color: theme.secondaryText },
                      ]}
                    >
                      {category.planned > 0
                        ? `${category.planned} planned hrs still upcoming`
                        : 'No planned hours remaining'}
                    </Text>

                    <View
                      style={[
                        styles.barTrack,
                        { backgroundColor: theme.muted },
                      ]}
                    >
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

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Trip Progress
          </Text>

          {tripTotals.every((trip) => trip.total === 0) ? (
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
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
                      <Text style={[styles.chartLabel, { color: theme.text }]}>
                        {trip.title}
                      </Text>
                      <Text
                        style={[styles.chartValue, { color: theme.secondaryText }]}
                      >
                        {trip.completed} hrs done
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.tripDestination,
                        { color: theme.secondaryText },
                      ]}
                    >
                      {trip.destination} • {trip.activityCount} activities •{' '}
                      {trip.planned} planned hrs
                    </Text>

                    <View
                      style={[
                        styles.barTrack,
                        { backgroundColor: theme.muted },
                      ]}
                    >
                      <View style={[styles.barFill, { width }]} />
                    </View>
                  </View>
                );
              })
          )}
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Destination List
          </Text>

          {trips.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
              No trips added yet.
            </Text>
          ) : (
            trips.map((trip) => (
              <View key={trip.id} style={styles.destinationRow}>
                <Text style={styles.destinationPin}>📍</Text>
                <View style={styles.destinationTextBlock}>
                  <Text
                    style={[styles.destinationTitle, { color: theme.text }]}
                  >
                    {trip.destination}
                  </Text>
                  <Text
                    style={[
                      styles.destinationSubtitle,
                      { color: theme.secondaryText },
                    ]}
                  >
                    {trip.title}
                  </Text>
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
    borderRadius: 14,
    flexGrow: 1,
    padding: 14,
    width: '47%',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    borderRadius: 14,
    marginBottom: 14,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  progressSummaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  progressSummaryCard: {
    borderRadius: 12,
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  progressSummaryValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  progressSummaryLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  progressBreakdownText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  segmentedControl: {
    borderRadius: 12,
    flexDirection: 'row',
    padding: 3,
    borderWidth: 1,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    paddingVertical: 8,
  },
  segmentButtonSelected: {
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  rangeText: {
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
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  chartValue: {
    fontSize: 14,
  },
  secondaryLine: {
    fontSize: 12,
    marginBottom: 6,
  },
  tripDestination: {
    fontSize: 12,
    marginBottom: 6,
  },
  barTrack: {
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
    fontSize: 15,
    fontWeight: '700',
  },
  destinationSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});