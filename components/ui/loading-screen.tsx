import { Image, StyleSheet, Text, View } from 'react-native';

type LoadingScreenProps = {
  progress?: number;
};

export default function LoadingScreen({
  progress = 0.6,
}: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/roamly-square.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Roamly</Text>
      <Text style={styles.subtitle}>Getting everything ready...</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 28,
  },
  progressTrack: {
    width: '75%',
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 999,
  },
});