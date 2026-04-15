import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trip, TripPlannerContext } from '../_layout';

function formatIrishDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export default function IndexScreen() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('All');

  if (!context) return null;

  const { trips } = context;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const destinationOptions = [
    'All',
    ...Array.from(new Set(trips.map((trip: Trip) => trip.destination))).sort(),
  ];

  const filteredTrips = trips.filter((trip: Trip) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      trip.title.toLowerCase().includes(normalizedQuery) ||
      trip.destination.toLowerCase().includes(normalizedQuery) ||
      (trip.notes ?? '').toLowerCase().includes(normalizedQuery);

    const matchesDestination =
      selectedDestination === 'All' || trip.destination === selectedDestination;

    return matchesSearch && matchesDestination;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Travel Planner"
        subtitle={`${trips.length} trips planned`}
      />

      <PrimaryButton label="Add Trip" onPress={() => router.push('../add')} />

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by title, destination, or notes"
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        {destinationOptions.map((destination) => {
          const isSelected = selectedDestination === destination;

          return (
            <Pressable
              key={destination}
              accessibilityLabel={`Filter by destination ${destination}`}
              accessibilityRole="button"
              onPress={() => setSelectedDestination(destination)}
              style={[
                styles.filterButton,
                isSelected && styles.filterButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  isSelected && styles.filterButtonTextSelected,
                ]}
              >
                {destination}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTrips.length === 0 ? (
          <Text style={styles.emptyText}>No trips match your filters</Text>
        ) : (
          filteredTrips.map((trip: Trip) => (
            <Pressable
              key={trip.id}
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={`Open trip ${trip.title}`}
              onPress={() => router.push(`/trips/${trip.id}`)}
            >
              <Text style={styles.cardTitle}>{trip.title}</Text>
              <Text style={styles.cardSubtitle}>{trip.destination}</Text>
              <Text style={styles.cardDates}>
                {formatIrishDate(trip.startDate)} -{' '}
                {formatIrishDate(trip.endDate)}
              </Text>
              {trip.notes ? (
                <Text style={styles.cardNotes}>{trip.notes}</Text>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 14,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#94A3B8',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#94A3B8',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextSelected: {
    color: '#FFFFFF',
  },
  emptyText: {
    color: '#475569',
    fontSize: 16,
    paddingTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    padding: 14,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#334155',
    fontSize: 15,
    marginTop: 4,
  },
  cardDates: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 6,
  },
  cardNotes: {
    color: '#475569',
    fontSize: 14,
    marginTop: 8,
  },
});