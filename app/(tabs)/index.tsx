import StudentCard from '@/components/StudentCard';
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
import { Student, StudentContext } from '../_layout';

export default function IndexScreen() {
  const router = useRouter();
  const context = useContext(StudentContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');

  if (!context) return null;

  const { students } = context;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const yearOptions = [
    'All',
    ...Array.from(new Set(students.map((student: Student) => String(student.year)))).sort(
      (a, b) => Number(a) - Number(b)
    ),
  ];

  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      student.name.toLowerCase().includes(normalizedQuery) ||
      student.major.toLowerCase().includes(normalizedQuery);

    const matchesYear =
      selectedYear === 'All' || String(student.year) === selectedYear;

    return matchesSearch && matchesYear;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Students"
        subtitle={`${students.length} enrolled`}
      />

      <PrimaryButton
        label="Add Student"
        onPress={() => router.push({ pathname: '../add' })}
      />

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name or major"
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        {yearOptions.map((year) => {
          const isSelected = selectedYear === year;

          return (
            <Pressable
              key={year}
              accessibilityLabel={`Filter by year ${year}`}
              accessibilityRole="button"
              onPress={() => setSelectedYear(year)}
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
                {year}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredStudents.length === 0 ? (
          <Text style={styles.emptyText}>No students match your filters</Text>
        ) : (
          filteredStudents.map((student: Student) => (
            <StudentCard key={student.id} student={student} />
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
});
