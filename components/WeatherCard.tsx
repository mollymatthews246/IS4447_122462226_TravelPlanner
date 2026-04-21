import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface WeatherData {
  location: string;
  temp: number;
  weatherLabel: string;
  weatherIcon: string;
  windSpeed: number;
  forecast: { date: string; high: number; low: number }[];
}

function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌧️';
  if (code <= 99) return '⛈️';
  return '🌤️';
}

function getWeatherLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

function formatDay(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IE', { weekday: 'short' });
}

export default function WeatherCard({ destination }: { destination: string }) {
  const { theme, isDark } = useTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (destination) {
      void fetchWeather();
    }
  }, [destination]);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`
      );
      const geoData = await geoRes.json();

      if (!geoData.results?.length) {
        setError('Location not found');
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`
      );
      const w = await weatherRes.json();

      setWeather({
        location: `${name}, ${country}`,
        temp: Math.round(w.current.temperature_2m),
        weatherLabel: getWeatherLabel(w.current.weather_code),
        weatherIcon: getWeatherIcon(w.current.weather_code),
        windSpeed: Math.round(w.current.wind_speed_10m),
        forecast: w.daily.time.map((date: string, i: number) => ({
          date,
          high: Math.round(w.daily.temperature_2m_max[i]),
          low: Math.round(w.daily.temperature_2m_min[i]),
        })),
      });
    } catch {
      setError('Could not load weather');
    } finally {
      setLoading(false);
    }
  };

  if (!destination) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, shadowOpacity: isDark ? 0 : 0.05 }]}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🌤️</Text>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Weather</Text>
        {error && (
          <Pressable onPress={() => void fetchWeather()}>
            <Text style={{ fontSize: 16 }}>🔄</Text>
          </Pressable>
        )}
      </View>

      {loading && <ActivityIndicator size="small" style={{ marginVertical: 12 }} />}

      {error && !loading && (
        <Text style={[styles.errorText, { color: theme.secondaryText }]}>{error}</Text>
      )}

      {weather && !loading && (
        <>
          <View style={styles.currentRow}>
            <Text style={styles.currentIcon}>{weather.weatherIcon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.temp, { color: theme.text }]}>{weather.temp}°C</Text>
              <Text style={[styles.condition, { color: theme.secondaryText }]}>
                {weather.weatherLabel}
              </Text>
              <Text style={[styles.wind, { color: theme.secondaryText }]}>
                💨 {weather.windSpeed} km/h
              </Text>
            </View>
          </View>

          {weather.forecast.length > 0 && (
            <View style={[styles.forecastRow, { borderTopColor: theme.border }]}>
              {weather.forecast.map((day, i) => (
                <View key={day.date} style={styles.forecastDay}>
                  <Text style={[styles.forecastLabel, { color: theme.secondaryText }]}>
                    {formatDay(day.date, i)}
                  </Text>
                  <Text style={[styles.forecastHigh, { color: theme.text }]}>{day.high}°</Text>
                  <Text style={[styles.forecastLow, { color: theme.secondaryText }]}>{day.low}°</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.attribution, { color: theme.secondaryText }]}>
            Data from Open-Meteo.com
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentIcon: {
    fontSize: 40,
    marginRight: 14,
  },
  temp: {
    fontSize: 28,
    fontWeight: '700',
  },
  condition: {
    fontSize: 14,
    marginTop: 2,
  },
  wind: {
    fontSize: 13,
    marginTop: 2,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  forecastDay: {
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  forecastHigh: {
    fontSize: 16,
    fontWeight: '700',
  },
  forecastLow: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  attribution: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 10,
  },
});