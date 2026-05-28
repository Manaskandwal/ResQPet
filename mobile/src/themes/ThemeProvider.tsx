import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './tokens';

export type Theme = 'dark' | 'light';
export type ThemeMode = 'system' | 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  colors: typeof darkTheme | typeof lightTheme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  const getTheme = (): Theme => {
    if (themeMode === 'system') {
      return (systemColorScheme as Theme) || 'dark';
    }
    return themeMode;
  };

  const theme = getTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Update theme when system preference changes
  useEffect(() => {
    if (themeMode === 'system' && systemColorScheme) {
      // Theme will automatically update via getTheme()
    }
  }, [systemColorScheme, themeMode]);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, colors, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useColors = () => {
  const { colors } = useTheme();
  return colors;
};
