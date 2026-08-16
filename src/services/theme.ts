import { useState, useEffect } from 'react';
import type { ThemeMode } from '../types';

const THEME_STORAGE_KEY = 'disfraces_eu_theme';

export const useTheme = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
    return saved || 'system';
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);

    const applyTheme = () => {
      let activeTheme: 'light' | 'dark' = 'light';
      if (themeMode === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        activeTheme = themeMode;
      }
      document.documentElement.setAttribute('data-theme', activeTheme);
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  return { themeMode, setThemeMode };
};
