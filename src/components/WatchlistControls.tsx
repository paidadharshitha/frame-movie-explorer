import { Pressable, StyleSheet, View } from 'react-native';
import { useWatchlist } from '../state/WatchlistProvider';
import { fonts, useTheme, useThemedStyles, type ThemeColors } from '../theme';
import type { Movie } from '../types/movie';
import { AppText, Button, Icon } from './ui';

/** Viewing plans are independent of the films someone keeps as favourites. */
export function WatchlistControls({ movie }: { movie: Movie }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { getStatus, setStatus, removeMovie, isHydrated } = useWatchlist();
  const status = getStatus(movie.id);
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Icon
          name={status === 'watched' ? 'checkmark-circle-outline' : 'time-outline'}
          color={colors.accent}
          size={23}
        />
        <AppText accessibilityRole="header" style={styles.title}>
          {status === 'watched' ? 'One for the memories.' : 'Make it a movie night.'}
        </AppText>
      </View>
      <AppText accessibilityLiveRegion="polite" style={styles.description}>
        {status === 'watched'
          ? 'Marked as watched. Find it in your Watchlist’s Watched tab.'
          : status === 'planned'
            ? 'On your watchlist, ready when you are.'
            : 'Plan your next watch, or keep track of what you’ve seen.'}
      </AppText>
      <View style={styles.actions}>
        <Button
          secondary
          disabled={!isHydrated}
          icon={status === 'planned' ? 'checkmark-outline' : 'add-outline'}
          onPress={() => setStatus(movie, status === 'planned' ? 'watched' : 'planned')}
          style={styles.mainAction}
        >
          {status === 'planned'
            ? 'Mark as watched'
            : status === 'watched'
              ? 'Move to watchlist'
              : 'Add to watchlist'}
        </Button>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !isHydrated }}
          disabled={!isHydrated}
          onPress={() => (status ? removeMovie(movie.id) : setStatus(movie, 'watched'))}
          style={({ pressed }) => [styles.quietAction, (pressed || !isHydrated) && styles.dimmed]}
        >
          <AppText style={styles.quietText}>
            {status ? 'Remove from list' : 'Already watched'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      marginTop: 28,
      paddingVertical: 24,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontFamily: fonts.display, fontSize: 27, lineHeight: 32, flex: 1 },
    description: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
    mainAction: { flexGrow: 1 },
    quietAction: {
      minHeight: 48,
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexGrow: 1,
    },
    quietText: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium },
    dimmed: { opacity: 0.5 },
  });
