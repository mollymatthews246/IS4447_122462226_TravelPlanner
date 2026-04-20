import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { targets as targetsTable } from '@/db/schema';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripPlannerContext } from '../../context/trip-planner-context';

export default function AddTarget() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);

  const [type, setType] = useState('weekly');
  const [metricType, setMetricType] = useState('duration');
  const [targetValue, setTargetValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [error, setError] = useState('');

  if (!context) return null;

  const { trips, categories, setTargets } = context;

  const saveTarget = async () => {
    if (!targetValue.trim() || !startDate.trim() || !endDate.trim()) {
      setError('Please fill in the target value, start date and end date.');
      return;
    }

    await db.insert(targetsTable).values({
      userId: 1,
      tripId: selectedTripId,
      categoryId: selectedCategoryId,
      type,
      metricType,
      targetValue: Number(targetValue),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
    });

    const rows = await db.select().from(targetsTable);
    setTargets(rows);

    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Add Target" subtitle="Create a weekly or monthly goal." />

        <Text style={styles.label}>Target Type</Text>
        <View style={styles.optionRow}>
          {['weekly', 'monthly'].map((option) => {
            const isSelected = type === option;

            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => setType(option)}
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
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Metric</Text>
        <View style={styles.optionRow}>
          {['duration', 'count'].map((option) => {
            const isSelected = metricType === option;

            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => setMetricType(option)}
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
                  {option === 'duration' ? 'Hours' : 'Activities'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.form}>
          <FormField
            label={metricType === 'duration' ? 'Target Hours' : 'Target Number of Activities'}
            value={targetValue}
            onChangeText={setTargetValue}
            placeholder={metricType === 'duration' ? 'e.g. 6' : 'e.g. 3'}
          />

          <FormField
            label="Start Date"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
          />

          <FormField
            label="End Date"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <Text style={styles.label}>Trip</Text>
        <View style={styles.optionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedTripId(null)}
            style={[
              styles.optionButton,
              selectedTripId === null && styles.optionButtonSelected,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                selectedTripId === null && styles.optionTextSelected,
              ]}
            >
              All Trips
            </Text>
          </Pressable>

          {trips.map((trip) => {
            const isSelected = selectedTripId === trip.id;

            return (
              <Pressable
                key={trip.id}
                accessibilityRole="button"
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

        <Text style={styles.label}>Category</Text>
        <View style={styles.optionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedCategoryId(null)}
            style={[
              styles.optionButton,
              selectedCategoryId === null && styles.optionButtonSelected,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                selectedCategoryId === null && styles.optionTextSelected,
              ]}
            >
              All Categories
            </Text>
          </Pressable>

          {categories.map((category) => {
            const isSelected = selectedCategoryId === category.id;

            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton label="Save Target" onPress={saveTarget} />

        <View style={styles.buttonSpacing}>
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
    padding: 20,
  },
  content: {
    paddingBottom: 24,
  },
  form: {
    marginBottom: 6,
  },
  label: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#94A3B8',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  optionText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  optionTextSelected: {
    color: '#FFFFFF',
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