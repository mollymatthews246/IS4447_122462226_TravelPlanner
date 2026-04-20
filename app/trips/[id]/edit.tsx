import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Colors } from '@/constants/theme';
import { db } from '@/db/client';
import { trips as tripsTable } from '@/db/schema';
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
      <SafeAreaView style={{ flex: 1, padding: 40 }}>
        <Text style={{ fontSize: 16, color: 'red' }}>
          Trip not found.
        </Text>
      </SafeAreaView>
    );
  }

  const { setTrips, currentUser } = context;

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
        color: Colors.light.tint,
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
          color: isStart || isEnd ? Colors.light.tint : '#D4EEFA',
          textColor: isStart || isEnd ? '#FFFFFF' : '#065A82',
        };
      });
    }

    return marks;
  }, [startDate, endDate]);

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Edit Trip" subtitle={`Update ${trip.title}`} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.card}>
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
          <Text style={styles.sectionTitle}>Travel Dates</Text>
          <View style={styles.card}>
            <Pressable
              style={styles.calendarToggle}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Text style={styles.calendarToggleText}>
                {startDate && endDate
                  ? formatDisplayDate(startDate) +
                    ' – ' +
                    formatDisplayDate(endDate)
                  : 'Tap to select dates'}
              </Text>
              <Text style={styles.chevron}>
                {showCalendar ? '▲' : '▼'}
              </Text>
            </Pressable>

            {startDate && endDate ? (
              <View style={styles.nightsBadge}>
                <Text style={styles.nightsText}>
                  {getNightCount(startDate, endDate)} night
                  {getNightCount(startDate, endDate) !== 1 ? 's' : ''}
                </Text>
              </View>
            ) : null}

            {showCalendar ? (
              <View style={styles.calendarWrapper}>
                <Text style={styles.calendarHint}>
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
                    todayTextColor: Colors.light.tint,
                    dayTextColor: Colors.light.text,
                    textDisabledColor: '#CBD5E1',
                    monthTextColor: Colors.light.text,
                    textMonthFontWeight: '600',
                    textMonthFontSize: 15,
                    textDayFontSize: 14,
                    textDayHeaderFontSize: 12,
                    arrowColor: Colors.light.tint,
                  }}
                />
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Packing reminders, booking refs, ideas..."
              placeholderTextColor={Colors.light.icon}
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
    backgroundColor: '#F8FAFC',
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
    color: Colors.light.icon,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
    color: Colors.light.text,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  nightsBadge: {
    backgroundColor: '#E8F6FC',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
  },
  nightsText: {
    fontSize: 13,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  calendarWrapper: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  calendarHint: {
    fontSize: 13,
    color: Colors.light.icon,
    textAlign: 'center',
    marginBottom: 8,
  },
  notesInput: {
    fontSize: 15,
    color: Colors.light.text,
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