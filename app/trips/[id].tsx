import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { trips as tripsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trip, TripPlannerContext } from '../_layout';

function formatIrishDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripPlannerContext);

  if (!context) return null;

  const { trips, setTrips } = context;

  const trip = trips.find((t: Trip) => t.id === Number(id));

  if (!trip) return null;

  const deleteTrip = async () => {
    await db.delete(tripsTable).where(eq(tripsTable.id, Number(id)));

    const rows = await db.select().from(tripsTable);
    setTrips(rows);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={trip.title} subtitle="Trip details" />

      <View style={styles.tags}>
        <InfoTag label="Destination" value={trip.destination} />
        <InfoTag
          label="Dates"
          value={`${formatIrishDate(trip.startDate)} - ${formatIrishDate(
            trip.endDate
          )}`}
        />
      </View>

      {trip.notes ? <Text style={styles.notes}>{trip.notes}</Text> : null}

      <PrimaryButton
        label="Edit Trip"
        onPress={() =>
          router.push({
            pathname: '/trips/[id]/edit',
            params: { id },
          })
        }
      />

      <View style={styles.buttonSpacing}>
        <PrimaryButton label="Delete Trip" variant="secondary" onPress={deleteTrip} />
      </View>
      <View style={styles.buttonSpacing}>
        <PrimaryButton
          label="Back to Home"
          variant="secondary"
          onPress={() => router.push('/')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    padding: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  notes: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
    padding: 14,
  },
  buttonSpacing: {
    marginTop: 10,
  },
});