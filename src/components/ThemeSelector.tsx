import { Pressable, StyleSheet, View } from 'react-native';
import { fonts, useTheme, useThemedStyles, type ThemeColors, type ThemeMode } from '../theme';
import { AppText, Icon, InlineNotice, type IconName } from './ui';

const options: { mode: ThemeMode; label: string; icon: IconName }[] = [
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export function ThemeSelector() {
  const { colors, mode, setMode, isHydrated, storageError, retrySave } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <AppText accessibilityRole="header" style={styles.title}>
        Appearance
      </AppText>
      <AppText style={styles.description}>
        Set the mood. System follows your device’s appearance.
      </AppText>
      <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Appearance">
        {options.map((option) => {
          const selected = mode === option.mode;
          return (
            <Pressable
              key={option.mode}
              accessibilityRole="radio"
              accessibilityLabel={`${option.label} appearance`}
              accessibilityState={{ checked: selected, disabled: !isHydrated }}
              disabled={!isHydrated}
              onPress={() => setMode(option.mode)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selected,
                pressed && styles.pressed,
                !isHydrated && styles.disabled,
              ]}
            >
              <Icon
                name={option.icon}
                size={19}
                color={selected ? colors.onAccent : colors.muted}
              />
              <AppText style={[styles.label, selected && { color: colors.onAccent }]}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {storageError && (
        <InlineNotice message={storageError} action="Retry" onAction={retrySave} warning />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      marginTop: 32,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34 },
    description: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 4 },
    options: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
    option: {
      minHeight: 48,
      minWidth: 90,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 24,
      backgroundColor: colors.raised,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: { backgroundColor: colors.accent },
    label: { fontFamily: fonts.medium, fontSize: 13 },
    pressed: { opacity: 0.75 },
    disabled: { opacity: 0.5 },
  });
