import ScreenHeader from '@/components/ui/screen-header';
import { useContext } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripPlannerContext } from '../_layout';

export default function ProfileScreen() {
  const context = useContext(TripPlannerContext);

  if (!context) return null;

  const { currentUser } = context;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Profile" subtitle="Manage your account" />

      <Text style={styles.text}>
        Logged in as {currentUser?.name ?? 'No user'}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    padding: 20,
  },
  text: {
    color: '#0F172A',
    fontSize: 16,
  },
});