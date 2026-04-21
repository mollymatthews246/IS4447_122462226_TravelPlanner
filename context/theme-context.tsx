import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

type AppTheme = {
  background: string;
  card: string;
  text: string;
  secondaryText: string;
  border: string;
  inputBackground: string;
  primary: string;
  muted: string;
};

type ThemeContextType = {
  themeMode: ThemeMode;
  theme: AppTheme;
  toggleTheme: () => Promise<void>;
  isDark: boolean;
};

const lightTheme: AppTheme = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  secondaryText: '#64748B',
  border: '#CBD5E1',
  inputBackground: '#FFFFFF',
  primary: '#1A8A7D',
  muted: '#E2E8F0',
};

const darkTheme: AppTheme = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  secondaryText: '#CBD5E1',
  border: '#334155',
  inputBackground: '#1E293B',
  primary: '#34D399',
  muted: '#334155',
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

type Props = {
  children: ReactNode;
};

export function ThemeProvider({ children }: Props) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem('themeMode');

      if (storedTheme === 'light' || storedTheme === 'dark') {
        setThemeMode(storedTheme);
      }
    };

    void loadTheme();
  }, []);

  const toggleTheme = async () => {
    const nextTheme: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    await AsyncStorage.setItem('themeMode', nextTheme);
  };

  const value = useMemo(
    () => ({
      themeMode,
      theme: themeMode === 'light' ? lightTheme : darkTheme,
      toggleTheme,
      isDark: themeMode === 'dark',
    }),
    [themeMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}