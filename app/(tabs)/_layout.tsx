import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useContext } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { TripPlannerContext } from '../../context/trip-planner-context';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const context = useContext(TripPlannerContext);

  const currentUser = context?.currentUser;
  const initial = currentUser?.name?.charAt(0)?.toUpperCase() || 'P';

  const HeaderTitle = () => {
    return (
      <Image
        source={require('@/assets/images/roamly-header.png')}
        style={styles.headerLogo}
        resizeMode="contain"
      />
    );
  };

  const HeaderButtons = () => {
    const isHomePage = pathname === '/';
    const isProfilePage = pathname === '/profile';

    return (
      <View style={styles.headerButtons}>
        {!isHomePage && (
          <Pressable onPress={() => router.push('/')} style={styles.iconButton}>
            <Ionicons name="home-outline" size={20} color="#111827" />
          </Pressable>
        )}

        {!isProfilePage && (
          <Pressable
            onPress={() => router.push('/profile')}
            style={styles.profileButton}
          >
            <Text style={styles.profileText}>{initial}</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <HeaderTitle />,
        headerTitleAlign: 'center',
        headerRight: () => <HeaderButtons />,
        tabBarActiveTintColor: '#1A8A7D',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          height: 66,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          title: 'Category',
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="targets"
        options={{
          title: 'Targets',
          tabBarIcon: ({ color }) => (
            <Ionicons name="flag-outline" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => (
            <Ionicons name="bar-chart-outline" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLogo: {
    width: 190,
    height: 60,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A8A7D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});