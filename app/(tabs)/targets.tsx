import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, Target, TripPlannerContext } from '../../context/trip-planner-context';

function formatIrishDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function getTargetProgress(target: Target, activities: Activity[]) {
  const matchingActivities = activities.filter((activity) => {
    const withinDateRange =
      activity.activityDate >= target.startDate &&
      activity.activityDate <= target.endDate;

    const matchesTrip = !target.tripId || activity.tripId === target.tripId;

    const matchesCategory =
      !target.categoryId || activity.categoryId === target.categoryId;

    return withinDateRange && matchesTrip && matchesCategory;
  });

  if (target.metricType === 'duration') {
    return matchingActivities.reduce(
      (total, activity) => total + activity.duration,
      0
    );
  }

  return matchingActivities.reduce(
    (total, activity) => total + activity.count,
    0
  );
}

export default function TargetsScreen() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);

  if (!context) return null;

  const { targets, trips, categories, activities } = context;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Targets" subtitle={`${targets.length} goals set`} />

      <PrimaryButton
        label="Add Target"
        onPress={() => router.push('/targets/add')}
      />

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {targets.length === 0 ? (
          <Text style={styles.emptyText}>
            No targets yet. Add a weekly or monthly goal.
          </Text>
        ) : (
          targets.map((target) => {
            const trip = trips.find((item) => item.id === target.tripId);
            const category = categories.find(
              (item) => item.id === target.categoryId
            );

            const progress = getTargetProgress(target, activities);
            const remaining = target.targetValue - progress;
            const percentage = Math.min(
              (progress / target.targetValue) * 100,
              100
            );

            const status =
              progress > target.targetValue
                ? 'Exceeded'
                : progress === target.targetValue
                  ? 'Met'
                  : 'Unmet';

            const unit =
              target.metricType === 'duration' ? 'hours' : 'activities';

            return (
                <Pressable
                    key={target.id}
                    style={styles.card}
                    accessibilityRole="button"
                    accessibilityLabel="Edit target"
                    onPress={() =>
                        router.push({
                        pathname: '/targets/[id]/edit',
                        params: { id: String(target.id) },
                        })
                    }
                >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {category?.name ?? 'All Categories'} Target
                  </Text>
                  <Text style={styles.statusBadge}>{status}</Text>
                </View>

                <Text style={styles.cardSubtitle}>
                  {target.type} goal • {trip?.title ?? 'All Trips'}
                </Text>

                <Text style={styles.progressText}>
                  Progress: {progress} / {target.targetValue} {unit}
                </Text>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>

                <Text style={styles.detailText}>
                  {remaining > 0
                    ? `${remaining} ${unit} remaining`
                    : `Exceeded by ${Math.abs(remaining)} ${unit}`}
                </Text>

                <Text style={styles.dateText}>
                  {formatIrishDate(target.startDate)} -{' '}
                  {formatIrishDate(target.endDate)}
                </Text>

                <Text style={styles.tapText}>Tap to edit</Text>
              </Pressable>
            );
          })
        )}
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
  listContent: {
    paddingBottom: 24,
    paddingTop: 14,
  },
  emptyText: {
    color: '#475569',
    fontSize: 16,
    paddingTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    padding: 14,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#0F172A',
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 5,
    textTransform: 'capitalize',
  },
  progressText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  progressTrack: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    height: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#22C55E',
    height: '100%',
  },
  detailText: {
    color: '#475569',
    fontSize: 14,
    marginTop: 8,
  },
  dateText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
  },
  tapText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});