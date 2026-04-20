import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { activities as activitiesTable } from '@/db/schema';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripPlannerContext } from '../../context/trip-planner-context';

export default function AddActivity() {
  const { tripId, activityDate: selectedDate } = useLocalSearchParams<{
    tripId: string;
    activityDate?: string;
  }>();

  const router = useRouter();
  const context = useContext(TripPlannerContext);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    context?.categories[0]?.id ?? null
  );
  const [title, setTitle] = useState('');
  const [activityDate, setActivityDate] = useState(selectedDate ?? '');
  const [duration, setDuration] = useState('');
  const [count, setCount] = useState('1');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('planned');
  const [error, setError] = useState('');

  if (!context) return null;

  const { categories, setActivities } = context;

  const saveActivity = async () => {
    if (
      !title.trim() ||
      !activityDate.trim() ||
      !duration.trim() ||
      !selectedCategoryId
    ) {
      setError('Please fill in the activity title, date, duration and category.');
      return;
    }

    setError('');

    await db.insert(activitiesTable).values({
      tripId: Number(tripId),
      categoryId: selectedCategoryId,
      title: title.trim(),
      activityDate: activityDate.trim(),
      duration: Number(duration),
      count: Number(count) || 1,
      notes: notes.trim(),
      status,
    });

    const rows = await db.select().from(activitiesTable);
    setActivities(rows);

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
          subtitle="Add something planned for this trip."
        />

        <View style={styles.form}>
          <FormField
            label="Activity Title"
            value={title}
            onChangeText={setTitle}
          />

          <FormField
            label="Date"
            value={activityDate}
            onChangeText={setActivityDate}
            placeholder="YYYY-MM-DD"
          />

          <FormField
            label="Duration"
            value={duration}
            onChangeText={setDuration}
            placeholder="Hours, e.g. 2"
          />

          <FormField
            label="Number of Activities"
            value={count}
            onChangeText={setCount}
            placeholder="e.g. 1"
          />

          <Text style={styles.label}>Category</Text>
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

          <Text style={styles.label}>Status</Text>
          <View style={styles.optionRow}>
            {['planned', 'completed'].map((option) => {
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
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <FormField label="Notes" value={notes} onChangeText={setNotes} />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton label="Save Activity" onPress={saveActivity} />

        <View style={styles.backButton}>
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
  backButton: {
    marginTop: 10,
  },
});