import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import {
  activities as activitiesTable,
  trips as tripsTable,
} from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Activity,
  TripPlannerContext,
} from '../../../context/trip-planner-context';

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

export default function EditActivity() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripPlannerContext);
  const { theme } = useTheme();

  const activity = context?.activities.find(
    (item: Activity) => item.id === Number(id)
  );

  const [title, setTitle] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [duration, setDuration] = useState('1');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'planned' | 'completed'>('planned');
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!activity) return;

    setTitle(activity.title);
    setActivityDate(activity.activityDate);
    setDuration(String(activity.duration));
    setNotes(activity.notes ?? '');
    setStatus(activity.status as 'planned' | 'completed');
    setSelectedTripId(activity.tripId);
    setSelectedCategoryId(activity.categoryId);
  }, [activity]);

  if (!context || !activity) return null;

  const { currentUser, trips, setActivities, categories } = context;

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId),
    [trips, selectedTripId]
  );

  const refreshUserActivities = async () => {
    if (!currentUser) return;

    const userTrips = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.userId, currentUser.id));

    const userTripIds = userTrips.map((trip) => trip.id);
    const allActivities = await db.select().from(activitiesTable);

    const filteredActivities = allActivities.filter((item) =>
      userTripIds.includes(item.tripId)
    );

    setActivities(filteredActivities);
  };

  const saveChanges = async () => {
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

    await db
      .update(activitiesTable)
      .set({
        tripId: selectedTripId,
        title: title.trim(),
        activityDate,
        duration: Number(duration),
        count: 1,
        notes: notes.trim(),
        status,
        categoryId: selectedCategoryId,
      })
      .where(eq(activitiesTable.id, Number(id)));

    await refreshUserActivities();
    router.back();
  };

  const deleteActivity = async () => {
    await db.delete(activitiesTable).where(eq(activitiesTable.id, Number(id)));
    await refreshUserActivities();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Edit Activity"
          subtitle={`Update ${activity.title}`}
        />

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose Trip</Text>
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
                    {
                      backgroundColor: isSelected ? theme.text : theme.card,
                      borderColor: isSelected ? theme.text : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isSelected ? theme.background : theme.text,
                      },
                    ]}
                  >
                    {trip.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedTrip ? (
            <Text style={[styles.helperText, { color: theme.secondaryText }]}>
              Destination: {selectedTrip.destination}
            </Text>
          ) : null}

          <FormField
            label="Activity Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Eiffel Tower visit"
          />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose Category</Text>
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
                    {
                      backgroundColor: isSelected ? theme.text : theme.card,
                      borderColor: isSelected ? theme.text : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isSelected ? theme.background : theme.text,
                      },
                    ]}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Hours</Text>
          <View
            style={[
              styles.valueBox,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            <Pressable
              style={[styles.stepButton, { backgroundColor: theme.card }]}
              onPress={() =>
                setDuration(String(Math.max(1, (Number(duration) || 1) - 1)))
              }
            >
              <Text style={[styles.stepButtonText, { color: theme.text }]}>−</Text>
            </Pressable>

            <Text style={[styles.valueText, { color: theme.text }]}>{duration || '1'} hrs</Text>

            <Pressable
              style={[styles.stepButton, { backgroundColor: theme.card }]}
              onPress={() => setDuration(String((Number(duration) || 0) + 1))}
            >
              <Text style={[styles.stepButtonText, { color: theme.text }]}>+</Text>
            </Pressable>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Date</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select activity date"
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.dateButtonText,
                { color: theme.text },
                !activityDate && { color: theme.secondaryText },
              ]}
            >
              {formatIrishDate(activityDate)}
            </Text>
          </Pressable>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Status</Text>
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
                    {
                      backgroundColor: isSelected ? theme.text : theme.card,
                      borderColor: isSelected ? theme.text : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isSelected ? theme.background : theme.text,
                      },
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

          <PrimaryButton label="Save Changes" onPress={saveChanges} />

          <View style={styles.buttonSpacing}>
            <PrimaryButton
              label="Delete Activity"
              variant="secondary"
              onPress={deleteActivity}
            />
          </View>

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
          onChange={(_, selectedDate) => {
            if (Platform.OS !== 'ios') {
              setShowDatePicker(false);
            }
            if (selectedDate) {
              setActivityDate(formatDateForStorage(selectedDate));
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 20,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  helperText: {
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
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  valueBox: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    padding: 10,
  },
  stepButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  stepButtonText: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
  valueText: {
    fontSize: 20,
    fontWeight: '800',
  },
  dateButton: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 15,
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