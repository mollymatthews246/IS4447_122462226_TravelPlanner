import { useTheme } from '@/hooks/useTheme';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  compact?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export default function PrimaryButton({
  label,
  onPress,
  compact = false,
  variant = 'primary',
}: Props) {
  const { theme, isDark } = useTheme();

  const backgroundColor =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
        ? '#B91C1C'
        : theme.card;

  const borderColor =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
        ? '#991B1B'
        : theme.border;

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : theme.text;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === 'secondary' || variant === 'danger' ? 1 : 0,
        },
        compact ? styles.compact : null,
        pressed ? styles.pressed : null,
        isDark && variant === 'secondary' ? styles.secondaryDark : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: textColor },
          compact ? styles.compactLabel : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  compact: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  compactLabel: {
    fontSize: 13,
  },
  secondaryDark: {
    opacity: 0.95,
  },
});