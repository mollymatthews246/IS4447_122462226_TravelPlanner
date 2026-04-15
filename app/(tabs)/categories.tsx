import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripPlannerContext } from '../_layout';

function getCategoryEmoji(icon: string) {
  const icons: Record<string, string> = {
    camera: '📷',
    tree: '🌳',
    utensils: '🍽️',
    coffee: '☕',
    'shopping-bag': '🛍️',
    bus: '🚌',
    landmark: '🏛️',
    music: '🎵',
    horse: '🐴',
  };

  return icons[icon] ?? '📍';
}

function displayCategoryIcon(icon: string) {
  return icon.length <= 4 ? icon : getCategoryEmoji(icon);
}

export default function CategoriesScreen() {
  const router = useRouter();
  const context = useContext(TripPlannerContext);

  if (!context) return null;

  const { categories } = context;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Categories"
        subtitle={`${categories.length} activity categories`}
      />

      <PrimaryButton
        label="Add Category"
        onPress={() => router.push('/categories/add')}
      />

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.length === 0 ? (
          <Text style={styles.emptyText}>No categories yet.</Text>
        ) : (
          categories.map((category) => (
            <View key={category.id} style={styles.card}>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: category.color },
                ]}
              />

              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{category.name}</Text>
              </View>

              <Text style={styles.iconText}>
                {displayCategoryIcon(category.icon)}
              </Text>
            </View>
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
  emptyText: {
    color: '#475569',
    fontSize: 16,
    paddingTop: 8,
    textAlign: 'center',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 14,
  },
  colorDot: {
    borderRadius: 999,
    height: 18,
    marginRight: 12,
    width: 18,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  iconText: {
    fontSize: 24,
  },
});