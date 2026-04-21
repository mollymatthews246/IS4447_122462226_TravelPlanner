import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import {
  activities as activitiesTable,
  trips as tripsTable,
} from '@/db/schema';
import DateTimePicker from '@react-native-community/datetimepicker';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripPlannerContext } from '../../context/trip-planner-context';

function formatIrishDate(dateString: string) {
  if (!dateString) return 'Select date';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateForStorage(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AddActivity() {
  const { tripId: initialTripId, activityDate: selectedDate } =
    useLocalSearchParams<{
      tripId?: string;
      activityDate?: string;
    }>();

  const router = useRouter();
  const context = useContext(TripPlannerContext);

  if (!context) return null;

  const { currentUser, trips, categories, setActivities } = context;

  const defaultTripId =
    initialTripId && !Number.isNaN(Number(initialTripId))
      ? Number(initialTripId)
      : trips[0]?.id ?? null;

  const [selectedTripId, setSelectedTripId] = useState<number | null>(
    defaultTripId
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    categories[0]?.id ?? null
  );
  const [title, setTitle] = useState('');
  const [activityDate, setActivityDate] = useState(selectedDate ?? '');
  const [duration, setDuration] = useState('1');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'planned' | 'completed'>('planned');
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId),
    [trips, selectedTripId]
  );

  const saveActivity = async () => {
    if (!selectedTripId) {
      setError('Please choose a trip.');
      return;
    }

    if (!title.trim() || !activityDate.trim() || !selectedCategoryId) {
      setError('Please enter a title, category and date.');
      return;
    }

    if (Number(duration) <= 0 || Number.isNaN(Number(duration))) {
      setError('Please enter a valid number of hours greater than 0.');
      return;
    }

    setError('');

    await db.insert(activitiesTable).values({
      tripId: selectedTripId,
      categoryId: selectedCategoryId,
      title: title.trim(),
      activityDate,
      duration: Number(duration),
      count: 1,
      notes: notes.trim(),
      status,
    });

    if (currentUser) {
      const userTrips = await db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.userId, currentUser.id));

      const userTripIds = userTrips.map((trip) => trip.id);
      const allActivities = await db.select().from(activitiesTable);

      const filteredActivities = allActivities.filter((activity) =>
        userTripIds.includes(activity.tripId)
      );

      setActivities(filteredActivities);
    }

    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Add Activity"
          subtitle="Add an activity to support your trip target progress."
        />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Choose Trip</Text>
          <View style={styles.optionRow}>
            {trips.map((trip) => {
              const isSelected = selectedTripId === trip.id;

              return (
                <Pressable
                  key={trip.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Select trip ${trip.title}`}
                  onPress={() => setSelectedTripId(trip.id)}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {trip.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedTrip ? (
            <Text style={styles.helperText}>
              Destination: {selectedTrip.destination}
            </Text>
          ) : null}

          <FormField
            label="Activity Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Eiffel Tower visit"
          />

          <Text style={styles.sectionTitle}>Choose Category</Text>
          <View style={styles.optionRow}>
            {categories.map((category) => {
              const isSelected = selectedCategoryId === category.id;

              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Select category ${category.name}`}
                  onPress={() => setSelectedCategoryId(category.id)}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Hours</Text>
          <View style={styles.valueBox}>
            <Pressable
              style={styles.stepButton}
              onPress={() =>
                setDuration(String(Math.max(1, (Number(duration) || 1) - 1)))
              }
            >
              <Text style={styles.stepButtonText}>−</Text>
            </Pressable>

            <Text style={styles.valueText}>{duration || '1'} hrs</Text>

            <Pressable
              style={styles.stepButton}
              onPress={() => setDuration(String((Number(duration) || 0) + 1))}
            >
              <Text style={styles.stepButtonText}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Date</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select activity date"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            <Text
              style={[
                styles.dateButtonText,
                !activityDate && styles.datePlaceholder,
              ]}
            >
              {formatIrishDate(activityDate)}
            </Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.optionRow}>
            {(['planned', 'completed'] as const).map((option) => {
              const isSelected = status === option;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={`Set status to ${option}`}
                  onPress={() => setStatus(option)}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <FormField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any extra details"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryButton label="Save Activity" onPress={saveActivity} />

          <View style={styles.buttonSpacing}>
            <PrimaryButton
              label="Cancel"
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={activityDate ? new Date(activityDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDateValue) => {
            if (Platform.OS !== 'ios') {
              setShowDatePicker(false);
            }
            if (selectedDateValue) {
              setActivityDate(formatDateForStorage(selectedDateValue));
            }
          }}
        />
      )}
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
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  helperText: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 14,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  optionButtonSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  optionText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  valueBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    padding: 10,
  },
  stepButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  stepButtonText: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
  valueText: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: {
    color: '#0F172A',
    fontSize: 15,
  },
  datePlaceholder: {
    color: '#94A3B8',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 10,
  },
  buttonSpacing: {
    marginTop: 10,
  },
});