import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setTheme } from '@/features/ui/uiSlice';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      dispatch(setTheme(storedTheme as 'light' | 'dark' | 'system'));
    } else {
      // Default to system preference
      dispatch(setTheme('system'));
    }
  }, [dispatch]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    // Apply theme
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return <>{children}</>;
}

// Helper hook to toggle theme
export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    dispatch(setTheme(newTheme));
  };

  const setSystemTheme = () => {
    dispatch(setTheme('system'));
  };

  const setLightTheme = () => {
    dispatch(setTheme('light'));
  };

  const setDarkTheme = () => {
    dispatch(setTheme('dark'));
  };

  return {
    theme,
    toggleTheme,
    setSystemTheme,
    setLightTheme,
    setDarkTheme,
    isLight: theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches),
    isDark: theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches),
    isSystem: theme === 'system',
  };
}