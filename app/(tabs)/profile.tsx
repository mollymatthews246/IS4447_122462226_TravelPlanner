import { db } from '@/db/client';
import { users as usersTable } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripPlannerContext } from '../../context/trip-planner-context';

export default function Profile() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);
  const { theme, themeMode, isDark, toggleTheme } = useTheme();

  const user = context?.currentUser;

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('loggedInUserId');
      context?.setCurrentUser(null);
      router.replace('/login');
    } catch (error) {
      console.log('LOGOUT ERROR:', error);
      Alert.alert('Error', 'Could not log out.');
    }
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete your profile? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteProfile },
      ]
    );
  };

  const deleteProfile = async () => {
    if (!user) return;

    try {
      await db.delete(usersTable).where(eq(usersTable.id, user.id));
      await AsyncStorage.removeItem('loggedInUserId');
      context?.setCurrentUser(null);

      Alert.alert('Profile deleted', 'Your account has been deleted.');
      router.replace('/register');
    } catch (error) {
      console.log('DELETE PROFILE ERROR:', error);
      Alert.alert('Error', 'Could not delete profile.');
    }
  };

  if (!user) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : 'Not available';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              Your account details
            </Text>
          </View>

          <View style={styles.toggleBlock}>
            <Text style={[styles.toggleLabel, { color: theme.secondaryText }]}>
              {themeMode === 'dark' ? 'Dark' : 'Light'}
            </Text>
            <Switch
              value={isDark}
              onValueChange={() => void toggleTheme()}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#CBD5E1"
              accessibilityLabel="Toggle dark mode"
            />
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
          <Text style={[styles.email, { color: theme.secondaryText }]}>
            {user.email}
          </Text>

          <View
            style={[
              styles.detailBox,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>
              Name
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {user.name}
            </Text>
          </View>

          <View
            style={[
              styles.detailBox,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>
              Email
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {user.email}
            </Text>
          </View>

          <View
            style={[
              styles.detailBox,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>
              Account Created
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {formattedDate}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.logoutButton, { backgroundColor: theme.primary }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Pressable style={styles.deleteButton} onPress={handleDeleteProfile}>
          <Text style={styles.deleteText}>Delete Profile</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingBottom: 140,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  toggleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 24,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
  },
  email: {
    fontSize: 15,
    marginTop: 4,
    marginBottom: 22,
  },
  detailBox: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
});