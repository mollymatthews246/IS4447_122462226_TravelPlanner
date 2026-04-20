import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { trips as tripsTable } from '@/db/schema';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripPlannerContext } from '../context/trip-planner-context';

export default function AddTrip() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!context) return null;

  const { setTrips } = context;

  const saveTrip = async () => {
    if (!title.trim() || !destination.trim() || !startDate.trim() || !endDate.trim()) {
      setError('Please fill in the trip title, destination, start date and end date.');
      return;
    }

    setError('');

    await db.insert(tripsTable).values({
      userId: 1,
      title: title.trim(),
      destination: destination.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      notes: notes.trim(),
    });

    const rows = await db.select().from(tripsTable);
    setTrips(rows);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Add Trip" subtitle="Create a new holiday plan." />

        <View style={styles.form}>
          <FormField label="Trip Title" value={title} onChangeText={setTitle} />
          <FormField
            label="Destination"
            value={destination}
            onChangeText={setDestination}
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
          <FormField label="Notes" value={notes} onChangeText={setNotes} />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton label="Save Trip" onPress={saveTrip} />

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
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 10,
  },
  backButton: {
    marginTop: 10,
  },
});