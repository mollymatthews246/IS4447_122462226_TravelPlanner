import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { trips as tripsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, Trip, TripPlannerContext } from '../../context/trip-planner-context';

function formatIrishDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripPlannerContext);

  if (!context) return null;

  const { trips, setTrips, activities, categories } = context;

  const trip = trips.find((t: Trip) => t.id === Number(id));

  if (!trip) return null;

  const tripActivities = activities.filter(
    (activity: Activity) => activity.tripId === trip.id
  );

  const deleteTrip = async () => {
    await db.delete(tripsTable).where(eq(tripsTable.id, Number(id)));

    const rows = await db.select().from(tripsTable);
    setTrips(rows);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activities</Text>

          {tripActivities.length === 0 ? (
            <Text style={styles.emptyText}>
              No activities added yet. Add your first activity for this trip.
            </Text>
          ) : (
            tripActivities.map((activity) => {
              const category = categories.find(
                (cat) => cat.id === activity.categoryId
              );

              return (
                <Pressable
                  key={activity.id}
                  style={styles.activityCard}
                  onPress={() => router.push(`/activities/${activity.id}/edit`)}
                >
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityMeta}>
                    {formatIrishDate(activity.activityDate)} • {activity.duration} hrs
                  </Text>
                  <Text style={styles.activityMeta}>
                    Category: {category?.name ?? 'Unknown'} • {activity.status}
                  </Text>
                  {activity.notes ? (
                    <Text style={styles.activityNotes}>{activity.notes}</Text>
                  ) : null}
                </Pressable>
              );
            })
          )}

          <PrimaryButton
            label="Add Activity"
            onPress={() => router.push(`/activities/add?tripId=${trip.id}`)}
          />
        </View>

        <PrimaryButton
          label="Edit Trip"
          onPress={() => router.push(`/trips/${id}/edit`)}
        />

        <View style={styles.buttonSpacing}>
          <PrimaryButton
            label="Delete Trip"
            variant="secondary"
            onPress={deleteTrip}
          />
        </View>

        <View style={styles.buttonSpacing}>
          <PrimaryButton
            label="Back to Home"
            variant="secondary"
            onPress={() => router.push('/')}
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 18,
    padding: 14,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
  },
  activityTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  activityMeta: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  activityNotes: {
    color: '#475569',
    fontSize: 14,
    marginTop: 6,
  },
  buttonSpacing: {
    marginTop: 10,
  },
});