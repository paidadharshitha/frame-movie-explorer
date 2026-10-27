import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { colors, fonts } from '../theme';
import type { ComponentProps, ReactNode } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({
  name,
  size = 22,
  color = colors.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
export function AppText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.text, style]} />;
}
export function IconButton({
  name,
  label,
  onPress,
  selected,
  disabled,
  style,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        selected && styles.selectedIcon,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={name} color={selected ? colors.onAccent : colors.text} />
    </Pressable>
  );
}
export function Button({
  children,
  onPress,
  icon,
  secondary,
  disabled,
  loading,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.text : colors.onAccent} />
      ) : icon ? (
        <Icon name={icon} size={19} color={secondary ? colors.text : colors.onAccent} />
      ) : null}
      <AppText style={[styles.buttonText, secondary && { color: colors.text }]}>{children}</AppText>
    </Pressable>
  );
}
export function StateView({
  icon,
  title,
  description,
  action,
  onAction,
  compact,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.state, compact && { paddingVertical: 32 }]}>
      <View style={styles.stateIcon}>
        <Icon name={icon} size={32} color={colors.accent} />
      </View>
      <AppText accessibilityRole="header" style={styles.stateTitle}>
        {title}
      </AppText>
      <AppText style={styles.stateDescription}>{description}</AppText>
      {action && onAction && (
        <Button onPress={onAction} icon="arrow-forward">
          {action}
        </Button>
      )}
    </View>
  );
}
export function InlineNotice({
  message,
  action,
  onAction,
  warning = false,
}: {
  message: string;
  action?: string;
  onAction?: () => void;
  warning?: boolean;
}) {
  return (
    <View style={styles.notice} accessibilityLiveRegion="polite">
      <Icon
        name={warning ? 'alert-circle-outline' : 'cloud-offline-outline'}
        color={warning ? colors.warning : colors.accent}
        size={18}
      />
      <AppText style={styles.noticeText}>{message}</AppText>
      {action && onAction && (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.noticeAction}>
          <AppText style={styles.link}>{action}</AppText>
        </Pressable>
      )}
    </View>
  );
}
export function Rating({ value, large = false }: { value: number | null; large?: boolean }) {
  return (
    <View
      style={[styles.rating, large && styles.ratingLarge]}
      accessibilityLabel={value === null ? 'Not yet rated' : `Rated ${value.toFixed(1)} out of 10`}
    >
      <Icon name="star" color={colors.accent} size={large ? 20 : 12} />
      <AppText style={[styles.ratingText, large && { fontSize: 20 }]}>
        {value === null ? 'NR' : value.toFixed(1)}
      </AppText>
      {large && value !== null && <AppText style={styles.muted}>/ 10</AppText>}
    </View>
  );
}
const styles = StyleSheet.create({
  text: { fontFamily: fonts.regular, color: colors.text, fontSize: 15, lineHeight: 22 },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.raised,
  },
  selectedIcon: { backgroundColor: colors.accent },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
  button: {
    minHeight: 50,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 28,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: colors.raised },
  buttonText: { color: colors.onAccent, fontFamily: fonts.bold, fontSize: 14 },
  state: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 64,
    gap: 16,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  stateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginBottom: 4,
  },
  stateTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, textAlign: 'center' },
  stateDescription: {
    textAlign: 'center',
    color: colors.muted,
    lineHeight: 23,
    marginBottom: 8,
    maxWidth: 350,
  },
  notice: {
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 48,
    backgroundColor: colors.raised,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.text },
  noticeAction: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 6 },
  link: { color: colors.accent, fontFamily: fonts.bold, fontSize: 12 },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(17,21,18,0.94)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    alignSelf: 'flex-start',
  },
  ratingLarge: { gap: 7, paddingHorizontal: 0, backgroundColor: 'transparent' },
  ratingText: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 18 },
  muted: { color: colors.muted, fontSize: 13 },
});
