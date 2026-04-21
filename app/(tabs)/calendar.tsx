import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { activities as activitiesTable } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trip, TripPlannerContext } from '../../context/trip-planner-context';

type CalendarViewMode = 'daily' | 'weekly' | 'monthly';

function formatIrishDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function parseDateOnly(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getDatesBetween(startDate: string, endDate: string) {
  const dates: string[] = [];
  const currentDate = parseDateOnly(startDate);
  const finalDate = parseDateOnly(endDate);

  while (currentDate <= finalDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function getDayName(dateString: string) {
  return parseDateOnly(dateString).toLocaleDateString('en-IE', {
    weekday: 'short',
  });
}

function getMonthName(dateString: string) {
  return parseDateOnly(dateString).toLocaleDateString('en-IE', {
    month: 'short',
  });
}

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

function tripOverlapsDateRange(
  trip: Trip,
  rangeStart: string,
  rangeEnd: string
) {
  return trip.startDate <= rangeEnd && trip.endDate >= rangeStart;
}

function getEmptyMessage(viewMode: CalendarViewMode) {
  if (viewMode === 'daily') return 'No trips planned for today.';
  if (viewMode === 'weekly') return 'No trips planned this week.';
  return 'No trips planned this month.';
}

function getRangeLabel(
  viewMode: CalendarViewMode,
  rangeStart: string,
  rangeEnd: string
) {
  if (viewMode === 'daily') {
    return `Today • ${formatIrishDate(rangeStart)}`;
  }

  if (viewMode === 'weekly') {
    return `This Week • ${formatIrishDate(rangeStart)} - ${formatIrishDate(
      rangeEnd
    )}`;
  }

  const monthDate = parseDateOnly(rangeStart);
  return monthDate.toLocaleDateString('en-IE', {
    month: 'long',
    year: 'numeric',
  });
}

export default function CalendarScreen() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);
  const { theme, isDark } = useTheme();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('monthly');

  if (!context) return null;

  const { currentUser, trips, activities, setActivities } = context;
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

  const filteredTrips = trips.filter((trip) =>
    tripOverlapsDateRange(trip, rangeStart, rangeEnd)
  );

  const refreshUserActivities = async () => {
    if (!currentUser) return;

    const userTripIds = trips.map((trip) => trip.id);
    const allActivities = await db.select().from(activitiesTable);

    const filteredActivities = allActivities.filter((activity) =>
      userTripIds.includes(activity.tripId)
    );

    setActivities(filteredActivities);
  };

  const markActivityComplete = async (activityId: number) => {
    await db
      .update(activitiesTable)
      .set({ status: 'completed' })
      .where(eq(activitiesTable.id, activityId));

    await refreshUserActivities();
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScreenHeader title="Calendar" subtitle="Your trip days at a glance" />

      <View
        style={[
          styles.segmentedControl,
          { backgroundColor: theme.muted, borderColor: theme.border },
        ]}
      >
        {(['daily', 'weekly', 'monthly'] as CalendarViewMode[]).map((mode) => {
          const isSelected = viewMode === mode;

          return (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityLabel={`Show ${mode} calendar view`}
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
        })}
      </View>

      <Text style={[styles.rangeText, { color: theme.secondaryText }]}>
        {getRangeLabel(viewMode, rangeStart, rangeEnd)}
      </Text>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredTrips.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={styles.emptyIcon}>🗓️</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {getEmptyMessage(viewMode)}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
              Add a trip or change the calendar view.
            </Text>
          </View>
        ) : (
          filteredTrips.map((trip: Trip) => {
            const tripDates = getDatesBetween(trip.startDate, trip.endDate).filter(
              (date) => date >= rangeStart && date <= rangeEnd
            );

            return (
              <View
                key={trip.id}
                style={[
                  styles.tripCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    shadowOpacity: isDark ? 0 : 0.06,
                  },
                ]}
              >
                <View style={styles.tripHeader}>
                  <View>
                    <Text style={[styles.tripTitle, { color: theme.text }]}>
                      {trip.title}
                    </Text>
                    <Text
                      style={[styles.tripSubtitle, { color: theme.secondaryText }]}
                    >
                      {trip.destination} • {formatIrishDate(trip.startDate)} -{' '}
                      {formatIrishDate(trip.endDate)}
                    </Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dateStrip}
                >
                  {tripDates.map((date) => {
                    const dayActivities = activities.filter(
                      (activity) =>
                        activity.tripId === trip.id &&
                        activity.activityDate === date
                    );

                    const hasActivities = dayActivities.length > 0;

                    return (
                      <View
                        key={date}
                        style={[
                          styles.dateTile,
                          {
                            backgroundColor: hasActivities
                              ? theme.text
                              : theme.inputBackground,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateTileDay,
                            {
                              color: hasActivities
                                ? '#FFFFFF'
                                : theme.secondaryText,
                            },
                          ]}
                        >
                          {getDayName(date)}
                        </Text>
                        <Text
                          style={[
                            styles.dateTileNumber,
                            {
                              color: hasActivities ? '#FFFFFF' : theme.text,
                            },
                          ]}
                        >
                          {formatIrishDate(date).slice(0, 2)}
                        </Text>
                        <Text
                          style={[
                            styles.dateTileMonth,
                            {
                              color: hasActivities
                                ? '#FFFFFF'
                                : theme.secondaryText,
                            },
                          ]}
                        >
                          {getMonthName(date)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>

                <View
                  style={[
                    styles.agendaList,
                    { borderTopColor: theme.border },
                  ]}
                >
                  {tripDates.map((date) => {
                    const dayActivities = activities
                      .filter(
                        (activity) =>
                          activity.tripId === trip.id &&
                          activity.activityDate === date
                      )
                      .sort((a, b) => {
                        if (a.status === b.status) return 0;
                        return a.status === 'planned' ? -1 : 1;
                      });

                    return (
                      <View key={date} style={styles.agendaRow}>
                        <View style={styles.agendaDate}>
                          <Text
                            style={[
                              styles.agendaDay,
                              { color: theme.secondaryText },
                            ]}
                          >
                            {getDayName(date)}
                          </Text>
                          <Text
                            style={[
                              styles.agendaNumber,
                              { color: theme.text },
                            ]}
                          >
                            {formatIrishDate(date).slice(0, 2)}
                          </Text>
                        </View>

                        <View style={styles.agendaContent}>
                          {dayActivities.length === 0 ? (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Add activity on ${formatIrishDate(
                                date
                              )}`}
                              onPress={() =>
                                router.push(
                                  `/activities/add?tripId=${trip.id}&activityDate=${date}`
                                )
                              }
                              style={[
                                styles.emptyAgendaPill,
                                {
                                  backgroundColor: theme.inputBackground,
                                  borderColor: theme.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.emptyAgendaText,
                                  { color: theme.secondaryText },
                                ]}
                              >
                                No activities planned
                              </Text>
                              <Text
                                style={[
                                  styles.addActivityText,
                                  { color: theme.primary },
                                ]}
                              >
                                + Add Activity
                              </Text>
                            </Pressable>
                          ) : (
                            dayActivities.map((activity) => {
                              const isCompleted = activity.status === 'completed';

                              return (
                                <Pressable
                                  key={activity.id}
                                  style={[
                                    styles.activityPill,
                                    {
                                      backgroundColor: isCompleted
                                        ? isDark
                                          ? '#183127'
                                          : '#ECFDF5'
                                        : isDark
                                          ? '#352618'
                                          : '#FFF7ED',
                                    },
                                  ]}
                                  onPress={() =>
                                    router.push(`/activities/${activity.id}/edit`)
                                  }
                                >
                                  <View
                                    style={[
                                      styles.activityDot,
                                      {
                                        backgroundColor: isCompleted
                                          ? '#22C55E'
                                          : '#F97316',
                                      },
                                    ]}
                                  />
                                  <View style={styles.activityTextBlock}>
                                    <Text
                                      style={[
                                        styles.activityTitle,
                                        { color: theme.text },
                                      ]}
                                    >
                                      {activity.title}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.activityMeta,
                                        { color: theme.secondaryText },
                                      ]}
                                    >
                                      {activity.duration} hrs • {activity.status}
                                    </Text>
                                  </View>

                                  {!isCompleted ? (
                                    <Pressable
                                      accessibilityRole="button"
                                      accessibilityLabel={`Mark ${activity.title} complete`}
                                      onPress={(event) => {
                                        event.stopPropagation();
                                        void markActivityComplete(activity.id);
                                      }}
                                      style={[
                                        styles.completeButton,
                                        { backgroundColor: theme.primary },
                                      ]}
                                    >
                                      <Text style={styles.completeButtonText}>
                                        Complete
                                      </Text>
                                    </Pressable>
                                  ) : (
                                    <View
                                      style={[
                                        styles.completedBadge,
                                        {
                                          backgroundColor: isDark
                                            ? '#214530'
                                            : '#DCFCE7',
                                        },
                                      ]}
                                    >
                                      <Text style={styles.completedBadgeText}>
                                        Done
                                      </Text>
                                    </View>
                                  )}
                                </Pressable>
                              );
                            })
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
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
  segmentedControl: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 12,
    padding: 3,
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
  },
  content: {
    paddingBottom: 24,
    paddingTop: 14,
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  tripCard: {
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tripHeader: {
    marginBottom: 14,
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  tripSubtitle: {
    fontSize: 13,
    marginTop: 5,
  },
  dateStrip: {
    gap: 8,
    paddingBottom: 14,
  },
  dateTile: {
    alignItems: 'center',
    borderRadius: 16,
    minWidth: 62,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  dateTileDay: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateTileNumber: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  dateTileMonth: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  agendaList: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  agendaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  agendaDate: {
    alignItems: 'center',
    width: 44,
  },
  agendaDay: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  agendaNumber: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  agendaContent: {
    flex: 1,
  },
  emptyAgendaPill: {
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: 12,
  },
  emptyAgendaText: {
    fontSize: 14,
  },
  addActivityText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  activityPill: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    padding: 12,
  },
  activityDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  activityTextBlock: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  activityMeta: {
    fontSize: 12,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  completeButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  completedBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  completedBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
  },
});