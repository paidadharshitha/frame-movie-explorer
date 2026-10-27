export type ThemeMode = 'dark' | 'light' | 'system';
export const THEME_STORAGE_KEY = '@frame/theme/v1';

export function parseThemePreference(raw: string | null): ThemeMode {
  if (raw === null) return 'dark';
  const value: unknown = JSON.parse(raw);
  if (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    value.version === 1 &&
    'mode' in value &&
    (value.mode === 'dark' || value.mode === 'light' || value.mode === 'system')
  )
    return value.mode;
  throw new Error('The saved appearance setting could not be read.');
}

export function serializeThemePreference(mode: ThemeMode): string {
  return JSON.stringify({ version: 1, mode });
}
