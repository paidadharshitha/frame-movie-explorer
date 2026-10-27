import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLibrary } from '../state/LibraryProvider';
import { useWatchlist } from '../state/WatchlistProvider';
import { fonts, useTheme, useThemedStyles, type ThemeColors } from '../theme';
import type { Movie } from '../types/movie';
import { AppText, Button, Icon, InlineNotice } from './ui';

export function PersonalActions({ movie }: { movie: Movie }) {
  const library = useLibrary();
  const watchlist = useWatchlist();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const rating = library.ratings.find((item) => item.movie.id === movie.id)?.value ?? null;
  const count = library.collections.filter((collection) =>
    collection.movies.some(({ id }) => id === movie.id),
  ).length;
  const canRate = library.isHydrated && watchlist.isHydrated;
  const create = () => {
    const result = library.createCollection(name);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.id) library.toggleCollectionMovie(result.id, movie);
    setName('');
    setError(null);
  };

  return (
    <View style={styles.section}>
      <View style={styles.ratingHeading}>
        <AppText accessibilityRole="header" style={styles.heading}>
          Your rating
        </AppText>
        <AppText accessibilityLiveRegion="polite" style={styles.ratingValue}>
          {rating ? `${rating} / 5` : 'Not rated yet'}
        </AppText>
      </View>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityLabel={`Rate ${movie.title} ${value} ${value === 1 ? 'star' : 'stars'} out of 5`}
            accessibilityState={{ checked: rating === value, disabled: !canRate }}
            disabled={!canRate}
            onPress={() => {
              library.setRating(movie, value);
              watchlist.setStatus(movie, 'watched');
            }}
            style={({ pressed }) => [
              styles.star,
              pressed && styles.pressed,
              !canRate && styles.disabled,
            ]}
          >
            <Icon
              name={rating !== null && value <= rating ? 'star' : 'star-outline'}
              color={rating !== null && value <= rating ? colors.accent : colors.muted}
              size={29}
            />
          </Pressable>
        ))}
      </View>
      <View style={styles.ratingFooter}>
        <AppText style={styles.note}>
          {canRate
            ? 'Rating marks this as watched. Saved on this device.'
            : 'Opening your library before you rate…'}
        </AppText>
        {rating !== null && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear your rating"
            disabled={!canRate}
            onPress={() => library.setRating(movie, null)}
            style={styles.clear}
          >
            <AppText style={styles.link}>Clear</AppText>
          </Pressable>
        )}
      </View>
      {!library.isHydrated && library.storageError && (
        <InlineNotice
          message={library.storageError}
          action="Retry"
          onAction={library.retrySave}
          warning
        />
      )}
      {!watchlist.isHydrated && watchlist.storageError && (
        <InlineNotice
          message={watchlist.storageError}
          action="Retry"
          onAction={watchlist.retrySave}
          warning
        />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          count ? `In ${count} collections. Manage collections` : 'Add to a collection'
        }
        accessibilityState={{ expanded, disabled: !library.isHydrated }}
        disabled={!library.isHydrated}
        onPress={() => setExpanded(!expanded)}
        style={({ pressed }) => [styles.collectionToggle, pressed && styles.pressed]}
      >
        <Icon name="albums-outline" color={colors.accent} size={21} />
        <AppText style={styles.toggleText}>
          {count
            ? `In ${count} ${count === 1 ? 'collection' : 'collections'}`
            : 'Add to a collection'}
        </AppText>
        <Icon
          name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
          color={colors.muted}
          size={19}
        />
      </Pressable>
      {expanded && (
        <View style={styles.collectionBody}>
          {library.collections.length === 0 && (
            <AppText style={styles.note}>
              Make a list for your next movie night. Start with a name below.
            </AppText>
          )}
          {library.collections.map((collection) => {
            const included = collection.movies.some(({ id }) => id === movie.id);
            return (
              <Pressable
                key={collection.id}
                accessibilityRole="checkbox"
                accessibilityLabel={collection.name}
                accessibilityState={{ checked: included }}
                onPress={() => library.toggleCollectionMovie(collection.id, movie)}
                style={({ pressed }) => [styles.collectionRow, pressed && styles.pressed]}
              >
                <Icon
                  name={included ? 'checkbox' : 'square-outline'}
                  color={included ? colors.accent : colors.muted}
                />
                <AppText numberOfLines={2} style={styles.collectionName}>
                  {collection.name}
                </AppText>
                <AppText style={styles.note}>{collection.movies.length}</AppText>
              </Pressable>
            );
          })}
          <AppText style={styles.label}>New collection</AppText>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError(null);
            }}
            accessibilityLabel="New collection name"
            placeholder="e.g. Weekend watch"
            placeholderTextColor={colors.subtle}
            selectionColor={colors.accent}
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={create}
            style={styles.input}
          />
          {error && (
            <AppText accessibilityRole="alert" style={styles.error}>
              {error}
            </AppText>
          )}
          <Button secondary icon="add-outline" onPress={create} disabled={!name.trim()}>
            Create & add this title
          </Button>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      paddingVertical: 24,
      marginVertical: 24,
    },
    ratingHeading: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
    },
    heading: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 26 },
    ratingValue: { color: colors.muted, fontSize: 13 },
    stars: { flexDirection: 'row', marginTop: 14, gap: 3 },
    star: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
    },
    ratingFooter: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 5 },
    note: { color: colors.muted, fontSize: 12, lineHeight: 19, flexShrink: 1 },
    clear: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 'auto',
    },
    link: { color: colors.accent, fontSize: 13, fontFamily: fonts.medium },
    collectionToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 56,
      marginTop: 20,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    toggleText: { flex: 1, fontFamily: fonts.medium, fontSize: 14 },
    collectionBody: { marginTop: 14, gap: 12 },
    collectionRow: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
    },
    collectionName: { flex: 1, fontSize: 14 },
    label: { fontFamily: fonts.medium, fontSize: 13, marginTop: 8 },
    input: {
      minHeight: 52,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: fonts.regular,
      fontSize: 15,
    },
    error: { color: colors.error, fontSize: 13 },
    pressed: { opacity: 0.65 },
    disabled: { opacity: 0.45 },
  });
