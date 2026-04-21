import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { targets as targetsTable } from '@/db/schema';
import DateTimePicker from '@react-native-community/datetimepicker';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
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

export default function AddTarget() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);

  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [targetValue, setTargetValue] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  if (!context) return null;

  const { currentUser, trips, categories, setTargets } = context;

  useEffect(() => {
    if (trips.length > 0 && selectedTripId === null) {
      setSelectedTripId(trips[0].id);
    }
  }, [trips, selectedTripId]);

  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    const selectedTrip = trips.find((trip) => trip.id === selectedTripId);

    if (selectedTrip) {
      setStartDate(selectedTrip.startDate);
      setEndDate(selectedTrip.endDate);
    }
  }, [selectedTripId, trips]);

  const saveTarget = async () => {
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
      setError('You must be logged in to create a target.');
      return;
    }

    setError('');

    await db.insert(targetsTable).values({
      userId: currentUser.id,
      tripId: selectedTripId,
      categoryId: selectedCategoryId,
      type: 'trip',
      metricType: 'duration',
      targetValue: Number(targetValue),
      startDate,
      endDate,
    });

    const rows = await db
      .select()
      .from(targetsTable)
      .where(eq(targetsTable.userId, currentUser.id));

    setTargets(rows);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Add Target"
          subtitle="Set an hours goal for a trip category."
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

          <Text style={styles.sectionTitle}>Hours Goal</Text>
          <View style={styles.valueBox}>
            <Pressable
              style={styles.stepButton}
              onPress={() =>
                setTargetValue(String(Math.max(1, (Number(targetValue) || 1) - 1)))
              }
            >
              <Text style={styles.stepButtonText}>−</Text>
            </Pressable>

            <Text style={styles.valueText}>{targetValue || '1'} hrs</Text>

            <Pressable
              style={styles.stepButton}
              onPress={() => setTargetValue(String((Number(targetValue) || 0) + 1))}
            >
              <Text style={styles.stepButtonText}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Target Period</Text>

          <Text style={styles.inputLabel}>Start Date</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select start date"
            onPress={() => setShowStartPicker(true)}
            style={styles.dateButton}
          >
            <Text
              style={[
                styles.dateButtonText,
                !startDate && styles.datePlaceholder,
              ]}
            >
              {formatIrishDate(startDate)}
            </Text>
          </Pressable>

          <Text style={styles.inputLabel}>End Date</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select end date"
            onPress={() => setShowEndPicker(true)}
            style={styles.dateButton}
          >
            <Text
              style={[
                styles.dateButtonText,
                !endDate && styles.datePlaceholder,
              ]}
            >
              {formatIrishDate(endDate)}
            </Text>
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryButton label="Save Target" onPress={saveTarget} />

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
  inputLabel: {
    color: '#334155',
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
    marginBottom: 14,
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