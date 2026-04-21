import { useTheme } from '@/hooks/useTheme';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
};

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
}: FormFieldProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText}
        secureTextEntry={secureTextEntry}
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});