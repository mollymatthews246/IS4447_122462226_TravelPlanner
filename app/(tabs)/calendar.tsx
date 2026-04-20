import ScreenHeader from '@/components/ui/screen-header';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trip, TripPlannerContext } from '../_layout';

type CalendarViewMode = 'daily' | 'weekly' | 'monthly';

function formatIrishDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function getDatesBetween(startDate: string, endDate: string) {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  const finalDate = new Date(endDate);

  while (currentDate <= finalDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function getDayName(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IE', {
    weekday: 'short',
  });
}

function getMonthName(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IE', {
    month: 'short',
  });
}

function toDateOnly(date: Date) {
  return date.toISOString().split('T')[0];
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

export default function CalendarScreen() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('monthly');

  if (!context) return null;

  const { trips, activities } = context;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Calendar" subtitle="Your trip days at a glance" />

      <View style={styles.segmentedControl}>
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
        {formatIrishDate(rangeStart)} - {formatIrishDate(rangeEnd)}
      </Text>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredTrips.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🗓️</Text>
            <Text style={styles.emptyTitle}>{getEmptyMessage(viewMode)}</Text>
            <Text style={styles.emptySubtitle}>
              Add a trip or change the calendar view.
            </Text>
          </View>
        ) : (
          filteredTrips.map((trip: Trip) => {
            const tripDates = getDatesBetween(trip.startDate, trip.endDate).filter(
              (date) => date >= rangeStart && date <= rangeEnd
            );

            return (
              <View key={trip.id} style={styles.tripCard}>
                <View style={styles.tripHeader}>
                  <View>
                    <Text style={styles.tripTitle}>{trip.title}</Text>
                    <Text style={styles.tripSubtitle}>
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
                          hasActivities && styles.dateTileActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateTileDay,
                            hasActivities && styles.dateTileTextActive,
                          ]}
                        >
                          {getDayName(date)}
                        </Text>
                        <Text
                          style={[
                            styles.dateTileNumber,
                            hasActivities && styles.dateTileTextActive,
                          ]}
                        >
                          {formatIrishDate(date).slice(0, 2)}
                        </Text>
                        <Text
                          style={[
                            styles.dateTileMonth,
                            hasActivities && styles.dateTileTextActive,
                          ]}
                        >
                          {getMonthName(date)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={styles.agendaList}>
                  {tripDates.map((date) => {
                    const dayActivities = activities.filter(
                      (activity) =>
                        activity.tripId === trip.id &&
                        activity.activityDate === date
                    );

                    return (
                      <View key={date} style={styles.agendaRow}>
                        <View style={styles.agendaDate}>
                          <Text style={styles.agendaDay}>{getDayName(date)}</Text>
                          <Text style={styles.agendaNumber}>
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
                              style={styles.emptyAgendaPill}
                            >
                              <Text style={styles.emptyAgendaText}>
                                No activities planned
                              </Text>
                              <Text style={styles.addActivityText}>
                                + Add Activity
                              </Text>
                            </Pressable>
                          ) : (
                            dayActivities.map((activity) => (
                              <View
                                key={activity.id}
                                style={styles.activityPill}
                              >
                                <View style={styles.activityDot} />
                                <View style={styles.activityTextBlock}>
                                  <Text style={styles.activityTitle}>
                                    {activity.title}
                                  </Text>
                                  <Text style={styles.activityMeta}>
                                    {activity.duration} hrs • {activity.status}
                                  </Text>
                                </View>
                              </View>
                            ))
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
    backgroundColor: '#F2F2F7',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  segmentedControl: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
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
  },
  content: {
    paddingBottom: 24,
    paddingTop: 14,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
  },
  tripHeader: {
    marginBottom: 14,
  },
  tripTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  tripSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
  },
  dateStrip: {
    gap: 8,
    paddingBottom: 14,
  },
  dateTile: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    minWidth: 62,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateTileActive: {
    backgroundColor: '#0F172A',
  },
  dateTileDay: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateTileNumber: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  dateTileMonth: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  dateTileTextActive: {
    color: '#FFFFFF',
  },
  agendaList: {
    borderTopColor: '#E5E7EB',
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
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  agendaNumber: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  agendaContent: {
    flex: 1,
  },
  emptyAgendaPill: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: 12,
  },
  emptyAgendaText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  addActivityText: {
    color: '#1A8A7D',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  activityPill: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    padding: 12,
  },
  activityDot: {
    backgroundColor: '#1A8A7D',
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  activityTextBlock: {
    flex: 1,
  },
  activityTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  activityMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
    textTransform: 'capitalize',
  },
});