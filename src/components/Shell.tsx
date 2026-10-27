import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useCommunity, useFavourites, useLibrary, useNetworkStatus, useWatchlist } from '../state';
import { AppText, Icon, IconButton, InlineNotice } from './ui';
import { fonts, useTheme, useThemedStyles, type ThemeColors } from '../theme';

export function Brand({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.brand}>
      <Icon name="scan-outline" color={colors.accent} size={compact ? 26 : 30} />
      <AppText style={[styles.wordmark, compact && { fontSize: 25 }]}>
        frame<AppText style={styles.dot}>.</AppText>
      </AppText>
    </View>
  );
}
export function ScreenHeader({ search = false }: { search?: boolean }) {
  const styles = useThemedStyles(createStyles);
  const { profile } = useCommunity();
  return (
    <View style={styles.topbar}>
      <Brand />
      <View style={styles.topActions}>
        {search && (
          <IconButton
            name="search-outline"
            label="Search movies and series"
            onPress={() => router.navigate('/search')}
          />
        )}
        <IconButton
          name={profile ? 'person' : 'person-outline'}
          label={profile ? 'Your profile' : 'Sign in'}
          selected={Boolean(profile)}
          onPress={() => router.push('/account')}
        />
      </View>
    </View>
  );
}
export function StatusNotices() {
  const { isOnline } = useNetworkStatus();
  const { storageError, retrySave } = useFavourites();
  const watchlist = useWatchlist();
  const community = useCommunity();
  const library = useLibrary();
  return (
    <>
      {!isOnline && <InlineNotice message="You’re offline. We’ll reconnect automatically." />}
      {storageError && (
        <InlineNotice message={storageError} action="Retry" onAction={retrySave} warning />
      )}
      {watchlist.storageError && (
        <InlineNotice
          message={watchlist.storageError}
          action="Retry"
          onAction={watchlist.retrySave}
          warning
        />
      )}
      {community.storageError && (
        <InlineNotice
          message={community.storageError}
          action="Retry"
          onAction={community.retrySave}
          warning
        />
      )}
      {library.storageError && (
        <InlineNotice
          message={library.storageError}
          action="Retry"
          onAction={library.retrySave}
          warning
        />
      )}
    </>
  );
}
const createScreenStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    title: {
      fontFamily: fonts.display,
      fontSize: 44,
      lineHeight: 48,
      color: colors.text,
      marginTop: 8,
    },
    subtitle: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 10, maxWidth: 520 },
  });
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    topbar: {
      paddingTop: 16,
      paddingBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 88,
    },
    topActions: { flexDirection: 'row', gap: 8 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    wordmark: { fontFamily: fonts.bold, fontSize: 29, lineHeight: 36, letterSpacing: -1.2 },
    dot: { color: colors.accent, fontSize: 30, fontFamily: fonts.bold },
  });

export function useScreenStyles() {
  return useThemedStyles(createScreenStyles);
}
