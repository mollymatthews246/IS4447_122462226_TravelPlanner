import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Activity,
  Target,
  TripPlannerContext,
} from '../../context/trip-planner-context';

function formatIrishDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function getTargetProgress(target: Target, activities: Activity[]) {
  const matchingActivities = activities.filter((activity) => {
    const withinDateRange =
      activity.activityDate >= target.startDate &&
      activity.activityDate <= target.endDate;

    const matchesTrip = activity.tripId === target.tripId;
    const matchesCategory = activity.categoryId === target.categoryId;
    const matchesStatus = activity.status === 'completed';

    return (
      withinDateRange &&
      matchesTrip &&
      matchesCategory &&
      matchesStatus
    );
  });

  return matchingActivities.reduce(
    (total, activity) => total + activity.duration,
    0
  );
}

function getStatus(progress: number, targetValue: number) {
  if (progress > targetValue) return 'Exceeded';
  if (progress === targetValue) return 'Completed';
  return 'In Progress';
}

function getStatusStyles(status: string) {
  if (status === 'Exceeded') {
    return {
      badge: styles.statusExceeded,
      text: styles.statusExceededText,
      bar: styles.progressExceeded,
    };
  }

  if (status === 'Completed') {
    return {
      badge: styles.statusCompleted,
      text: styles.statusCompletedText,
      bar: styles.progressCompleted,
    };
  }

  return {
    badge: styles.statusProgress,
    text: styles.statusProgressText,
    bar: styles.progressInProgress,
  };
}

export default function TargetsScreen() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);

  if (!context) return null;

  const { targets, trips, categories, activities } = context;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Targets"
        subtitle={`${targets.length} trip goals tracking your holiday progress`}
      />

      <PrimaryButton
        label="Add Target"
        onPress={() => router.push('/targets/add')}
      />

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {targets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No targets yet</Text>
            <Text style={styles.emptySubtitle}>
              Set a category hours goal for a trip and track it as you add
              activities.
            </Text>
          </View>
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

            const status = getStatus(progress, target.targetValue);
            const statusStyles = getStatusStyles(status);

            return (
              <Pressable
                key={target.id}
                style={styles.card}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${category?.name ?? 'target'} target`}
                onPress={() =>
                  router.push({
                    pathname: '/targets/[id]/edit',
                    params: { id: String(target.id) },
                  })
                }
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleBlock}>
                    <Text style={styles.cardTitle}>
                      {category?.name ?? 'Category'}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {trip?.title ?? 'Trip'}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, statusStyles.badge]}>
                    <Text style={[styles.statusText, statusStyles.text]}>
                      {status}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>Hours Goal</Text>
                  </View>

                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>
                      {formatIrishDate(target.startDate)} -{' '}
                      {formatIrishDate(target.endDate)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.goalText}>
                  Goal: {target.targetValue} hours
                </Text>

                <Text style={styles.progressText}>
                  Progress so far: {progress} hours
                </Text>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      statusStyles.bar,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>

                <Text style={styles.detailText}>
                  {remaining > 0
                    ? `${remaining} hours left to complete this goal`
                    : remaining === 0
                      ? 'You reached this goal exactly'
                      : `You exceeded this goal by ${Math.abs(remaining)} hours`}
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
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusExceeded: {
    backgroundColor: '#DBEAFE',
  },
  statusExceededText: {
    color: '#1D4ED8',
  },
  statusCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusCompletedText: {
    color: '#15803D',
  },
  statusProgress: {
    backgroundColor: '#FEF3C7',
  },
  statusProgressText: {
    color: '#B45309',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  metaChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  goalText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
  },
  progressText: {
    color: '#475569',
    fontSize: 14,
    marginTop: 6,
  },
  progressTrack: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    height: 10,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
  progressExceeded: {
    backgroundColor: '#3B82F6',
  },
  progressCompleted: {
    backgroundColor: '#22C55E',
  },
  progressInProgress: {
    backgroundColor: '#F59E0B',
  },
  detailText: {
    color: '#475569',
    fontSize: 14,
    marginTop: 10,
  },
  tapText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
});