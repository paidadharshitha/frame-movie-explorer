import { describe, expect, it } from 'vitest';
import {
  parseThemePreference,
  serializeThemePreference,
  type ThemeMode,
} from '../src/theme-preference';
import { darkColors, lightColors } from '../src/theme-tokens';

function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((start) => {
      const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
  };
  const first = luminance(a),
    second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe('appearance preferences', () => {
  it('preserves the original dark appearance for an existing install with no preference', () => {
    expect(parseThemePreference(null)).toBe('dark');
  });
  it.each<ThemeMode>(['light', 'dark', 'system'])(
    'restores %s across a storage round trip',
    (mode) => {
      expect(parseThemePreference(serializeThemePreference(mode))).toBe(mode);
    },
  );
  it.each([
    '{',
    'null',
    '"light"',
    '{"version":2,"mode":"light"}',
    '{"version":1,"mode":"sepia"}',
    '{"mode":"system"}',
  ])(
    'rejects unreadable or future data instead of silently replacing a saved preference (%s)',
    (raw) => {
      expect(() => parseThemePreference(raw)).toThrow();
    },
  );
});

describe.each([
  ['dark', darkColors],
  ['light', lightColors],
] as const)('%s palette accessibility', (_, colors) => {
  it.each(['background', 'surface', 'raised'] as const)(
    'keeps body and secondary text readable on %s',
    (surface) => {
      expect(contrast(colors.text, colors[surface])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.muted, colors[surface])).toBeGreaterThanOrEqual(4.5);
    },
  );
  it('keeps field placeholders and selected controls readable', () => {
    expect(contrast(colors.subtle, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.onAccent, colors.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.accent, colors.selection)).toBeGreaterThanOrEqual(4.5);
  });
  it('keeps errors and warning notices readable', () => {
    expect(contrast(colors.error, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.warning, colors.raised)).toBeGreaterThanOrEqual(4.5);
  });
});
