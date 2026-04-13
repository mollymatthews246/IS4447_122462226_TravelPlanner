import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { students as studentsTable } from '@/db/schema';
import { Student, StudentContext } from '../../_layout';

export default function EditStudent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(StudentContext);
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const student = context?.students.find(
    (s: Student) => s.id === Number(id)
  );

  useEffect(() => {
    if (!student) return;
    setName(student.name);
    setMajor(student.major);
    setYear(student.year);
  }, [student]);

  if (!context || !student) return null;

  const { setStudents } = context;

  const saveChanges = async () => {
    await db
      .update(studentsTable)
      .set({ name, major, year })
      .where(eq(studentsTable.id, Number(id)));

    const rows = await db.select().from(studentsTable);
    setStudents(rows);

    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Edit Student" subtitle={`Update ${student.name}`} />
      <View style={styles.form}>
        <FormField label="Name" value={name} onChangeText={setName} />
        <FormField label="Major" value={major} onChangeText={setMajor} />
        <FormField label="Year" value={year} onChangeText={setYear} />
      </View>

      <PrimaryButton label="Save Changes" onPress={saveChanges} />
      <View style={styles.buttonSpacing}>
        <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    padding: 20,
  },
  form: {
    marginBottom: 6,
  },
  buttonSpacing: {
    marginTop: 10,
  },
});
