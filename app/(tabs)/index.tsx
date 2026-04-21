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
import { Trip, TripPlannerContext } from '../../context/trip-planner-context';

function formatIrishDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function getTripStatus(startDate: string, endDate: string) {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (today < start) return 'Upcoming';
  if (today > end) return 'Completed';
  return 'Current';
}

function getDaysDifference(dateString: string) {
  const today = new Date();
  const targetDate = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const differenceInMs = targetDate.getTime() - today.getTime();
  return Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));
}

function getTripStatusText(trip: Trip) {
  const status = getTripStatus(trip.startDate, trip.endDate);

  if (status === 'Upcoming') {
    const daysUntil = getDaysDifference(trip.startDate);

    if (daysUntil === 0) return 'Starts today';
    if (daysUntil === 1) return 'Upcoming in 1 day';
    return `Upcoming in ${daysUntil} days`;
  }

  if (status === 'Current') {
    const daysLeft = getDaysDifference(trip.endDate);

    if (daysLeft === 0) return 'Ends today';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  }

  const daysSinceEnded = Math.abs(getDaysDifference(trip.endDate));

  if (daysSinceEnded === 0) return 'Completed today';
  if (daysSinceEnded === 1) return 'Completed 1 day ago';
  return `Completed ${daysSinceEnded} days ago`;
}

function getCardAccent(status: string) {
  switch (status) {
    case 'Upcoming':
      return {
        borderColor: '#3B82F6',
        badgeBackground: '#DBEAFE',
        badgeText: '#1D4ED8',
      };
    case 'Current':
      return {
        borderColor: '#10B981',
        badgeBackground: '#D1FAE5',
        badgeText: '#047857',
      };
    case 'Completed':
      return {
        borderColor: '#F59E0B',
        badgeBackground: '#FEF3C7',
        badgeText: '#B45309',
      };
    default:
      return {
        borderColor: '#CBD5E1',
        badgeBackground: '#E2E8F0',
        badgeText: '#334155',
      };
  }
}

export default function IndexScreen() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  if (!context) return null;

  const { trips } = context;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const destinationOptions = [
    'All',
    ...Array.from(new Set(trips.map((trip: Trip) => trip.destination))).sort(),
  ];

  const statusOptions = ['All', 'Upcoming', 'Current', 'Completed'];

  const filteredTrips = trips.filter((trip: Trip) => {
    const tripStatus = getTripStatus(trip.startDate, trip.endDate);

    const matchesSearch =
      normalizedQuery.length === 0 ||
      trip.title.toLowerCase().includes(normalizedQuery) ||
      trip.destination.toLowerCase().includes(normalizedQuery) ||
      (trip.notes ?? '').toLowerCase().includes(normalizedQuery);

    const matchesDestination =
      selectedDestination === 'All' || trip.destination === selectedDestination;

    const matchesStatus =
      selectedStatus === 'All' || tripStatus === selectedStatus;

    return matchesSearch && matchesDestination && matchesStatus;
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
        placeholder="Search trips"
        style={styles.searchInput}
      />

      <View style={styles.filtersSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {statusOptions.map((status) => {
            const isSelected = selectedStatus === status;

            return (
              <Pressable
                key={status}
                accessibilityLabel={`Filter by status ${status}`}
                accessibilityRole="button"
                onPress={() => setSelectedStatus(status)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {status}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {destinationOptions.map((destination) => {
            const isSelected = selectedDestination === destination;

            return (
              <Pressable
                key={destination}
                accessibilityLabel={`Filter by destination ${destination}`}
                accessibilityRole="button"
                onPress={() => setSelectedDestination(destination)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {destination}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTrips.length === 0 ? (
          <Text style={styles.emptyText}>No trips match your filters</Text>
        ) : (
          filteredTrips.map((trip: Trip) => {
            const status = getTripStatus(trip.startDate, trip.endDate);
            const statusText = getTripStatusText(trip);
            const accent = getCardAccent(status);

            return (
              <Pressable
                key={trip.id}
                style={[styles.card, { borderColor: accent.borderColor }]}
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

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: accent.badgeBackground },
                  ]}
                >
                  <Text
                    style={[styles.statusBadgeText, { color: accent.badgeText }]}
                  >
                    {status}
                  </Text>
                </View>

                <Text style={[styles.statusText, { color: accent.badgeText }]}>
                  {statusText}
                </Text>

                {trip.notes ? (
                  <Text style={styles.cardNotes} numberOfLines={2}>
                    {trip.notes}
                  </Text>
                ) : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filtersSection: {
    marginTop: 8,
  },
  filterScrollContent: {
    gap: 8,
    paddingRight: 10,
    paddingVertical: 4,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyText: {
    color: '#475569',
    fontSize: 15,
    paddingTop: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 10,
    padding: 14,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#334155',
    fontSize: 14,
    marginTop: 3,
  },
  cardDates: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  cardNotes: {
    color: '#475569',
    fontSize: 13,
    marginTop: 8,
  },
});