import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { trips as tripsTable } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trip, TripPlannerContext } from '../../../context/trip-planner-context';

function formatDisplayDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getNightCount(start: string, end: string): number {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const startDate = new Date(sy, sm - 1, sd);
  const endDate = new Date(ey, em - 1, ed);
  return Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function EditTrip() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripPlannerContext);
  const { theme, isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const trip = context?.trips.find((t: Trip) => t.id === Number(id));

  useEffect(() => {
    if (!trip) return;

    setTitle(trip.title);
    setDestination(trip.destination);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setNotes(trip.notes ?? '');
  }, [trip]);

  if (!context || !trip) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 40, backgroundColor: theme.background }}>
        <Text style={{ fontSize: 16, color: 'red' }}>
          Trip not found.
        </Text>
      </SafeAreaView>
    );
  }

  const { setTrips, currentUser } = context;

  const tintColor = '#0a7ea4';

  const onDayPress = (day: { dateString: string }) => {
    if (!startDate || endDate) {
      setStartDate(day.dateString);
      setEndDate(null);
    } else {
      if (day.dateString < startDate) {
        setStartDate(day.dateString);
        setEndDate(startDate);
      } else if (day.dateString === startDate) {
        setStartDate(null);
        setEndDate(null);
      } else {
        setEndDate(day.dateString);
      }
    }
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {};

    if (startDate && !endDate) {
      marks[startDate] = {
        startingDay: true,
        endingDay: true,
        color: tintColor,
        textColor: '#FFFFFF',
      };
    }

    if (startDate && endDate) {
      const [startYear, startMonth, startDay] = startDate
        .split('-')
        .map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
      const current = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);
      const dates: string[] = [];

      while (current <= end) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        current.setDate(current.getDate() + 1);
      }

      dates.forEach((dateStr) => {
        const isStart = dateStr === startDate;
        const isEnd = dateStr === endDate;

        marks[dateStr] = {
          startingDay: isStart,
          endingDay: isEnd,
          color: isStart || isEnd ? tintColor : isDark ? '#1A3A4A' : '#D4EEFA',
          textColor: isStart || isEnd ? '#FFFFFF' : isDark ? '#7DD3FC' : '#065A82',
        };
      });
    }

    return marks;
  }, [startDate, endDate, isDark]);

  const saveChanges = async () => {
    if (!currentUser) return;

    if (!title.trim() || !destination.trim() || !startDate || !endDate) {
      setError(
        'Please fill in the trip title, destination, and select your travel dates.'
      );
      return;
    }

    setError('');

    await db
      .update(tripsTable)
      .set({
        title: title.trim(),
        destination: destination.trim(),
        startDate,
        endDate,
        notes: notes.trim(),
      })
      .where(eq(tripsTable.id, Number(id)));

    const rows = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.userId, currentUser.id));
    setTrips(rows);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Edit Trip" subtitle={`Update ${trip.title}`} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Trip Details</Text>
          <View style={[styles.card, { backgroundColor: theme.card, shadowOpacity: isDark ? 0 : 0.05 }]}>
            <FormField
              label="Trip Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Summer in Spain"
            />
            <FormField
              label="Destination"
              value={destination}
              onChangeText={setDestination}
              placeholder="e.g. Barcelona"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Travel Dates</Text>
          <View style={[styles.card, { backgroundColor: theme.card, shadowOpacity: isDark ? 0 : 0.05 }]}>
            <Pressable
              style={styles.calendarToggle}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Text style={[styles.calendarToggleText, { color: theme.text }]}>
                {startDate && endDate
                  ? formatDisplayDate(startDate) +
                    ' – ' +
                    formatDisplayDate(endDate)
                  : 'Tap to select dates'}
              </Text>
              <Text style={[styles.chevron, { color: theme.secondaryText }]}>
                {showCalendar ? '▲' : '▼'}
              </Text>
            </Pressable>

            {startDate && endDate ? (
              <View style={[styles.nightsBadge, { backgroundColor: isDark ? '#1A3A4A' : '#E8F6FC' }]}>
                <Text style={[styles.nightsText, { color: isDark ? '#7DD3FC' : tintColor }]}>
                  {getNightCount(startDate, endDate)} night
                  {getNightCount(startDate, endDate) !== 1 ? 's' : ''}
                </Text>
              </View>
            ) : null}

            {showCalendar ? (
              <View style={[styles.calendarWrapper, { borderTopColor: theme.border }]}>
                <Text style={[styles.calendarHint, { color: theme.secondaryText }]}>
                  {!startDate
                    ? 'Tap your departure date'
                    : !endDate
                      ? 'Now tap your return date'
                      : 'Tap again to change dates'}
                </Text>
                <Calendar
                  markingType="period"
                  markedDates={markedDates}
                  onDayPress={onDayPress}
                  theme={{
                    backgroundColor: 'transparent',
                    calendarBackground: 'transparent',
                    todayTextColor: tintColor,
                    dayTextColor: theme.text,
                    textDisabledColor: theme.border,
                    monthTextColor: theme.text,
                    textMonthFontWeight: '600',
                    textMonthFontSize: 15,
                    textDayFontSize: 14,
                    textDayHeaderFontSize: 12,
                    arrowColor: tintColor,
                  }}
                />
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Notes</Text>
          <View style={[styles.card, { backgroundColor: theme.card, shadowOpacity: isDark ? 0 : 0.05 }]}>
            <TextInput
              style={[styles.notesInput, { color: theme.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Packing reminders, booking refs, ideas..."
              placeholderTextColor={theme.secondaryText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton label="Save Changes" onPress={saveChanges} />
        <View style={styles.cancelButton}>
          <PrimaryButton
            label="Cancel"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  calendarToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarToggleText: {
    fontSize: 15,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 12,
  },
  nightsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
  },
  nightsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  calendarWrapper: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  calendarHint: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  notesInput: {
    fontSize: 15,
    minHeight: 100,
    paddingTop: 0,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 10,
  },
});