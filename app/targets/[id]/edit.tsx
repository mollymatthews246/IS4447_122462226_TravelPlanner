import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { targets as targetsTable } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
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
  Target,
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

export default function EditTarget() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripPlannerContext);
  const { theme } = useTheme();

  const target = context?.targets.find(
    (item: Target) => item.id === Number(id)
  );

  const [targetValue, setTargetValue] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [error, setError] = useState('');

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (!target) return;

    setTargetValue(String(target.targetValue));
    setStartDate(target.startDate);
    setEndDate(target.endDate);
    setSelectedTripId(target.tripId);
    setSelectedCategoryId(target.categoryId);
  }, [target]);

  if (!context || !target) return null;

  const { currentUser, trips, categories, setTargets } = context;

  const saveChanges = async () => {
    if (!selectedTripId || !selectedCategoryId) {
      setError('Please choose a trip and category.');
      return;
    }

    if (!targetValue.trim()) {
      setError('Please enter your hours goal.');
      return;
    }

    if (Number(targetValue) <= 0 || Number.isNaN(Number(targetValue))) {
      setError('Please enter a valid number of hours greater than 0.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please choose a start date and end date.');
      return;
    }

    if (endDate < startDate) {
      setError('End date cannot be before the start date.');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to update a target.');
      return;
    }

    setError('');

    await db
      .update(targetsTable)
      .set({
        tripId: selectedTripId,
        categoryId: selectedCategoryId,
        type: 'trip',
        metricType: 'duration',
        targetValue: Number(targetValue),
        startDate,
        endDate,
      })
      .where(eq(targetsTable.id, Number(id)));

    const rows = await db
      .select()
      .from(targetsTable)
      .where(eq(targetsTable.userId, currentUser.id));

    setTargets(rows);

    router.back();
  };

  const deleteTarget = async () => {
    if (!currentUser) {
      setError('You must be logged in to delete a target.');
      return;
    }

    await db.delete(targetsTable).where(eq(targetsTable.id, Number(id)));

    const rows = await db
      .select()
      .from(targetsTable)
      .where(eq(targetsTable.userId, currentUser.id));

    setTargets(rows);

    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Edit Target"
          subtitle="Update your hours goal for this trip."
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

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Hours Goal</Text>
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
                setTargetValue(String(Math.max(1, (Number(targetValue) || 1) - 1)))
              }
            >
              <Text style={[styles.stepButtonText, { color: theme.text }]}>−</Text>
            </Pressable>

            <Text style={[styles.valueText, { color: theme.text }]}>{targetValue || '1'} hrs</Text>

            <Pressable
              style={[styles.stepButton, { backgroundColor: theme.card }]}
              onPress={() => setTargetValue(String((Number(targetValue) || 0) + 1))}
            >
              <Text style={[styles.stepButtonText, { color: theme.text }]}>+</Text>
            </Pressable>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Target Period</Text>

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Start Date</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select start date"
            onPress={() => setShowStartPicker(true)}
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
                !startDate && { color: theme.secondaryText },
              ]}
            >
              {formatIrishDate(startDate)}
            </Text>
          </Pressable>

          <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>End Date</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select end date"
            onPress={() => setShowEndPicker(true)}
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
                !endDate && { color: theme.secondaryText },
              ]}
            >
              {formatIrishDate(endDate)}
            </Text>
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryButton label="Save Changes" onPress={saveChanges} />

          <View style={styles.buttonSpacing}>
            <PrimaryButton
              label="Delete Target"
              variant="secondary"
              onPress={deleteTarget}
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

      {showStartPicker && (
        <DateTimePicker
          value={startDate ? new Date(startDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDate) => {
            if (Platform.OS !== 'ios') {
              setShowStartPicker(false);
            }
            if (selectedDate) {
              setStartDate(formatDateForStorage(selectedDate));
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate ? new Date(endDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDate) => {
            if (Platform.OS !== 'ios') {
              setShowEndPicker(false);
            }
            if (selectedDate) {
              setEndDate(formatDateForStorage(selectedDate));
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
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
    marginBottom: 14,
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