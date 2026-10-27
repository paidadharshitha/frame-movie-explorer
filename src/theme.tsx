import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './theme-tokens';
import {
  parseThemePreference,
  serializeThemePreference,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from './theme-preference';

export { fonts, layout, type ThemeColors } from './theme-tokens';
export type { ThemeMode } from './theme-preference';
// Compatibility for non-reactive startup consumers. Components use useTheme().
export const colors = darkColors;

type ThemeValue = {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  storageError: string | null;
  retrySave: () => void;
  isHydrated: boolean;
  reduceMotion: boolean;
};
const ThemeContext = createContext<ThemeValue>({
  colors: darkColors,
  isDark: true,
  mode: 'dark',
  setMode: () => undefined,
  storageError: null,
  retrySave: () => undefined,
  isHydrated: false,
  reduceMotion: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, updateMode] = useState<ThemeMode>('dark');
  const [isHydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(true);
  const modeRef = useRef<ThemeMode>('dark');
  const queue = useRef(Promise.resolve());
  const revision = useRef(0);
  const alive = useRef(true);
  const hydrationRequest = useRef(0);
  const hydrate = useCallback(async () => {
    const request = ++hydrationRequest.current;
    try {
      const saved = parseThemePreference(await AsyncStorage.getItem(THEME_STORAGE_KEY));
      if (!alive.current || request !== hydrationRequest.current) return;
      modeRef.current = saved;
      updateMode(saved);
      setStorageError(null);
      setHydrated(true);
    } catch {
      if (alive.current && request === hydrationRequest.current)
        setStorageError('Your saved appearance could not be read. Retry to keep your preference.');
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    void Promise.resolve().then(hydrate);
    let motionChanged = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      motionChanged = true;
      setReduceMotion(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (alive.current && !motionChanged) setReduceMotion(value);
      })
      .catch(() => undefined);
    return () => {
      alive.current = false;
      subscription.remove();
    };
  }, [hydrate]);
  const save = useCallback((next: ThemeMode) => {
    const currentRevision = ++revision.current;
    queue.current = queue.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await AsyncStorage.setItem(THEME_STORAGE_KEY, serializeThemePreference(next));
          if (alive.current && currentRevision === revision.current) setStorageError(null);
        } catch {
          if (alive.current && currentRevision === revision.current)
            setStorageError(
              'Appearance changed, but could not be saved on this device. Retry saving.',
            );
        }
      });
  }, []);
  const setMode = useCallback(
    (next: ThemeMode) => {
      if (!isHydrated) return;
      modeRef.current = next;
      updateMode(next);
      save(next);
    },
    [isHydrated, save],
  );
  const retrySave = useCallback(() => {
    if (isHydrated) save(modeRef.current);
    else void hydrate();
  }, [hydrate, isHydrated, save]);
  const isDark = mode === 'system' ? systemScheme !== 'light' : mode === 'dark';
  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      mode,
      setMode,
      storageError,
      retrySave,
      isHydrated,
      reduceMotion,
    }),
    [isDark, mode, setMode, storageError, retrySave, isHydrated, reduceMotion],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
// One sheet per component factory and palette, shared by virtualized card instances.
const styleCache = new WeakMap<(palette: ThemeColors) => unknown, WeakMap<ThemeColors, unknown>>();
export function useThemedStyles<T>(factory: (palette: ThemeColors) => T): T {
  const { colors: palette } = useTheme();
  return useMemo(() => {
    let palettes = styleCache.get(factory);
    if (!palettes) {
      palettes = new WeakMap();
      styleCache.set(factory, palettes);
    }
    if (!palettes.has(palette)) palettes.set(palette, factory(palette));
    return palettes.get(palette) as T;
  }, [factory, palette]);
}
