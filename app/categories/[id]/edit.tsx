import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { categories as categoriesTable } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Category,
  TripPlannerContext,
} from '../../../context/trip-planner-context';

const colorOptions = [
  '#3B82F6',
  '#22C55E',
  '#F97316',
  '#A855F7',
  '#EC4899',
  '#6366F1',
  '#EAB308',
  '#8B5A2B',
  '#EF4444',
  '#14B8A6',
];

const iconOptions = [
  '📷',
  '🌳',
  '🍽️',
  '☕',
  '🛍️',
  '🚌',
  '🏛️',
  '🎵',
  '🐴',
  '🏖️',
  '⛰️',
  '🚲',
  '⛵',
  '🎭',
  '🏨',
  '✈️',
];

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

export default function EditCategory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripPlannerContext);
  const { theme } = useTheme();

  const category = context?.categories.find(
    (item: Category) => item.id === Number(id)
  );

  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [icon, setIcon] = useState('📷');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!category) return;

    setName(category.name);
    setColor(category.color);
    setIcon(displayCategoryIcon(category.icon));
  }, [category]);

  if (!context || !category) return null;

  const { currentUser, setCategories } = context;

  const saveChanges = async () => {
    if (!name.trim() || !color.trim() || !icon.trim()) {
      setError('Please fill in the category name, colour and icon.');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to update a category.');
      return;
    }

    setError('');

    await db
      .update(categoriesTable)
      .set({
        name: name.trim(),
        color,
        icon,
      })
      .where(eq(categoriesTable.id, Number(id)));

    const rows = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.userId, currentUser.id));

    setCategories(rows);

    router.back();
  };

  const deleteCategory = async () => {
    if (!currentUser) {
      setError('You must be logged in to delete a category.');
      return;
    }

    await db.delete(categoriesTable).where(eq(categoriesTable.id, Number(id)));

    const rows = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.userId, currentUser.id));

    setCategories(rows);

    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Edit Category" subtitle={`Update ${category.name}`} />

        <View style={styles.form}>
          <FormField
            label="Category Name"
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: theme.text }]}>Choose Colour</Text>
          <View style={styles.optionGrid}>
            {colorOptions.map((option) => {
              const isSelected = color === option;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={`Select colour ${option}`}
                  onPress={() => setColor(option)}
                  style={[
                    styles.colorButton,
                    {
                      backgroundColor: option,
                      borderColor: isSelected ? theme.text : theme.border,
                      borderWidth: isSelected ? 3 : 1,
                    },
                  ]}
                />
              );
            })}
          </View>

          <Text style={[styles.label, { color: theme.text }]}>Choose Icon</Text>
          <View style={styles.optionGrid}>
            {iconOptions.map((option) => {
              const isSelected = icon === option;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={`Select icon ${option}`}
                  onPress={() => setIcon(option)}
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: theme.card,
                      borderColor: isSelected ? theme.text : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <Text style={styles.iconText}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton label="Save Changes" onPress={saveChanges} />

        <View style={styles.buttonSpacing}>
          <PrimaryButton
            label="Delete Category"
            variant="secondary"
            onPress={deleteCategory}
          />
        </View>

        <View style={styles.buttonSpacing}>
          <PrimaryButton
            label="Cancel"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
  },
  content: {
    paddingBottom: 24,
  },
  form: {
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  colorButton: {
    borderRadius: 999,
    height: 42,
    width: 42,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  iconText: {
    fontSize: 24,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 10,
  },
  buttonSpacing: {
    marginTop: 10,
  },
});