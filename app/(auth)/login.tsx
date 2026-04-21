import { db } from '@/db/client';
import {
  activities as activitiesTable,
  trips as tripsTable,
  users as usersTable,
} from '@/db/schema';
import { hashPassword } from '@/utils/hashPassword';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripPlannerContext } from '../../context/trip-planner-context';

export default function Login() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }

    if (!context) {
      Alert.alert('Error', 'App context not available.');
      return;
    }

    try {
      const hashedPassword = await hashPassword(password);

      const result = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, cleanEmail));

      const user = result[0];

      if (!user) {
        Alert.alert('Login failed', 'No account found with this email.');
        return;
      }

      if (user.password !== hashedPassword) {
        Alert.alert('Login failed', 'Incorrect password.');
        return;
      }

      await AsyncStorage.setItem('loggedInUserId', String(user.id));
      context.setCurrentUser(user);

      const userTrips = await db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.userId, user.id));

      context.setTrips(userTrips);

      const allActivities = await db.select().from(activitiesTable);
      const userTripIds = userTrips.map((trip) => trip.id);

      const userActivities = allActivities.filter((activity) =>
        userTripIds.includes(activity.tripId)
      );

      context.setActivities(userActivities);

      router.replace('/');
    } catch (error) {
      console.log('LOGIN ERROR:', error);
      Alert.alert('Error', 'Could not log in.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/roamly-square.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to continue planning</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#636E72"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#636E72"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/register')}>
            <Text style={styles.registerText}>
              Don&apos;t have an account? Register
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F7F8',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 200,
    height: 200,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#DDE5E7',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#636E72',
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFC8CA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: '#2D3436',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1A8A7D',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  registerText: {
    color: '#1A8A7D',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});