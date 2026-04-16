import { TripPlannerContext } from '@/app/_layout';
import { db } from '@/db/client';
import { users as usersTable } from '@/db/schema';
import { hashPassword } from '@/utils/hashPassword';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Register() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      Alert.alert('Missing details', 'Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    try {
      const hashedPassword = await hashPassword(password);

      const insertedUser = await db
        .insert(usersTable)
        .values({
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
        })
        .returning();

      const newUser = insertedUser[0];

      await AsyncStorage.setItem('loggedInUserId', String(newUser.id));

      context?.setCurrentUser(newUser);

      const savedUserId = await AsyncStorage.getItem('loggedInUserId');
      console.log('SAVED USER ID AFTER REGISTER:', savedUserId);

      Alert.alert('Success', 'Account created successfully.');

      router.replace('/');
    } catch (error: any) {
      console.log('REGISTER ERROR:', error);

      const errorMessage = String(error?.message || error).toLowerCase();

      if (
        errorMessage.includes('unique constraint failed') ||
        errorMessage.includes('users.email')
      ) {
        Alert.alert(
          'Account already exists',
          'An account with this email already exists. Please log in instead.'
        );
        return;
      }

      Alert.alert('Error', 'Could not create account.');
    }
  };

  const checkUsers = async () => {
    try {
      const allUsers = await db.select().from(usersTable);
      console.log('USERS IN DATABASE:', allUsers);
      Alert.alert(
        'Check terminal',
        'Users have been printed in the VS Code terminal.'
      );
    } catch (error) {
      console.log('CHECK USERS ERROR:', error);
      Alert.alert('Error', 'Could not read users.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start planning trips</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoCorrect={false}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
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
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Register</Text>
          </Pressable>

          <Pressable style={styles.testButton} onPress={checkUsers}>
            <Text style={styles.testButtonText}>Check Users</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.loginText}>
              Already have an account? Login
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
    backgroundColor: '#F6F7FB',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  testButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  loginText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});