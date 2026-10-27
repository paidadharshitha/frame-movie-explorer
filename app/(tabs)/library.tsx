import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader, StatusNotices, useScreenStyles } from '../../src/components/Shell';
import {
  AppText,
  Button,
  Icon,
  IconButton,
  InlineNotice,
  StateView,
} from '../../src/components/ui';
import { useLibrary } from '../../src/state/LibraryProvider';
import { useWatchlist } from '../../src/state/WatchlistProvider';
import type { MovieCollection, PersonalRating } from '../../src/state/library-store';
import { getCinemaStats } from '../../src/lib/cinema-stats';
import { fonts, useTheme, useThemedStyles, type ThemeColors } from '../../src/theme';
import type { Movie } from '../../src/types/movie';

type LibraryTab = 'collections' | 'ratings' | 'stats';
type LibraryItem = MovieCollection | PersonalRating;

function Poster({ movie }: { movie: Movie }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.poster}>
      <Icon name="film-outline" color={colors.subtle} size={25} />
      {movie.posterUrl && (
        <Image
          source={{ uri: movie.posterUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={movie.id}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

function RatingRow({ rating }: { rating: PersonalRating }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${rating.movie.title}, your rating ${rating.value} out of 5. View details`}
      onPress={() => router.push({ pathname: '/movie/[id]', params: { id: rating.movie.id } })}
      style={({ pressed }) => [styles.ratingRow, pressed && styles.pressed]}
    >
      <Poster movie={rating.movie} />
      <View style={styles.rowInfo}>
        <AppText numberOfLines={2} style={styles.rowTitle}>
          {rating.movie.title}
        </AppText>
        <AppText style={styles.note}>
          {[rating.movie.year, rating.movie.mediaType === 'series' ? 'Series' : 'Movie']
            .filter(Boolean)
            .join(' · ')}
        </AppText>
        <View style={styles.ratingLine}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Icon
              key={star}
              name={star <= rating.value ? 'star' : 'star-outline'}
              color={star <= rating.value ? colors.accent : colors.subtle}
              size={15}
            />
          ))}
          <AppText style={styles.note}>{rating.value} / 5</AppText>
        </View>
      </View>
      <Icon name="chevron-forward-outline" color={colors.muted} size={18} />
    </Pressable>
  );
}

function CinemaStats() {
  const { entries } = useWatchlist();
  const { ratings } = useLibrary();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const stats = useMemo(() => getCinemaStats(entries, ratings), [entries, ratings]);
  const maxGenre = stats.topGenres[0]?.count ?? 1;
  return (
    <View style={styles.stats}>
      <AppText accessibilityRole="header" style={styles.sectionTitle}>
        Your cinema, in numbers.
      </AppText>
      <AppText style={styles.note}>Built from your watched list and personal ratings.</AppText>
      <View style={styles.statTable}>
        {[
          ['Titles watched', String(stats.watchedCount)],
          ['Movies / series watched', `${stats.watchedMovies} / ${stats.watchedSeries}`],
          ['On your watchlist', String(stats.plannedCount)],
          ['Titles you’ve rated', String(stats.ratedCount)],
          [
            'Your average rating',
            stats.averageRating === null
              ? 'Not rated yet'
              : `${stats.averageRating.toFixed(1)} / 5`,
          ],
        ].map(([label, value]) => (
          <View key={label} style={styles.statRow}>
            <AppText style={styles.statLabel}>{label}</AppText>
            <AppText style={styles.statValue}>{value}</AppText>
          </View>
        ))}
      </View>
      <AppText accessibilityRole="header" style={styles.sectionTitle}>
        The genres you return to
      </AppText>
      {stats.topGenres.length ? (
        <View style={styles.genreList}>
          {stats.topGenres.map(({ name, count }) => (
            <View
              key={name}
              accessibilityLabel={`${name}: ${count} watched titles`}
              style={styles.genre}
            >
              <View style={styles.genreHeading}>
                <AppText style={styles.statLabel}>{name}</AppText>
                <AppText style={styles.note}>{count} watched</AppText>
              </View>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${(count / maxGenre) * 100}%` }]} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <AppText style={styles.emptyNote}>
          Mark a title as watched to discover your favourite genres.
        </AppText>
      )}
      <AppText accessibilityRole="header" style={styles.sectionTitle}>
        Your highest rated
      </AppText>
      {stats.highestRated.length ? (
        stats.highestRated.map((rating) => <RatingRow key={rating.movie.id} rating={rating} />)
      ) : (
        <View style={styles.statsEmpty}>
          <Icon name="star-outline" color={colors.accent} />
          <AppText style={styles.emptyNote}>
            Your five-star stories belong here. Open a title to give it your own rating.
          </AppText>
        </View>
      )}
      {!stats.watchedCount && !stats.ratedCount && (
        <Button secondary icon="compass-outline" onPress={() => router.navigate('/')}>
          Find your next story
        </Button>
      )}
    </View>
  );
}

export default function LibraryScreen() {
  const library = useLibrary();
  const watchlist = useWatchlist();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const screenStyles = useScreenStyles();
  const [tab, setTab] = useState<LibraryTab>('collections');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<MovieCollection | null>(null);
  const ratings = useMemo(
    () => [...library.ratings].sort((a, b) => b.ratedAt - a.ratedAt),
    [library.ratings],
  );
  const data: LibraryItem[] =
    tab === 'collections' ? library.collections : tab === 'ratings' ? ratings : [];
  const ready = library.isHydrated && (tab !== 'stats' || watchlist.isHydrated);
  const failed = library.storageError || (tab === 'stats' ? watchlist.storageError : null);
  const create = () => {
    const result = library.createCollection(name);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName('');
    setError(null);
    if (result.id) router.push({ pathname: '/collection/[id]', params: { id: result.id } });
  };
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={screenStyles.screen}>
      <FlatList<LibraryItem>
        data={data}
        keyExtractor={(item) => ('value' in item ? item.movie.id : item.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={
          <>
            <ScreenHeader search />
            <StatusNotices />
            <AppText accessibilityRole="header" style={screenStyles.title}>
              Your kind{`\n`}of cinema.
            </AppText>
            <AppText style={screenStyles.subtitle}>
              Collect your favourites, rate the stories you’ve seen, and discover your own taste.
            </AppText>
            <View style={styles.deviceNote}>
              <Icon name="phone-portrait-outline" color={colors.muted} size={15} />
              <AppText style={styles.note}>Your personal library. Saved on this device.</AppText>
            </View>
            <View style={styles.tabs}>
              {(['collections', 'ratings', 'stats'] as const).map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="tab"
                  accessibilityLabel={value === 'ratings' ? 'Your ratings' : value}
                  accessibilityState={{ selected: tab === value }}
                  onPress={() => setTab(value)}
                  style={({ pressed }) => [
                    styles.tab,
                    tab === value && styles.activeTab,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={[styles.tabText, tab === value && styles.activeTabText]}>
                    {value === 'collections'
                      ? 'Collections'
                      : value === 'ratings'
                        ? 'Your ratings'
                        : 'Stats'}
                  </AppText>
                </Pressable>
              ))}
            </View>
            {error && <InlineNotice message={error} warning />}
            {removed && (
              <InlineNotice
                message={`Removed “${removed.name}”.`}
                action="Undo"
                onAction={() => {
                  const restoreError = library.restoreCollection(removed);
                  setError(restoreError);
                  if (!restoreError) setRemoved(null);
                }}
              />
            )}
            {tab === 'collections' && ready && (
              <View style={styles.createForm}>
                <AppText accessibilityRole="header" style={styles.sectionTitle}>
                  Make room for a movie night.
                </AppText>
                <AppText style={styles.label}>Collection name</AppText>
                <View style={styles.createRow}>
                  <TextInput
                    value={name}
                    onChangeText={(value) => {
                      setName(value);
                      setError(null);
                    }}
                    accessibilityLabel="Collection name"
                    placeholder="e.g. Weekend watch"
                    placeholderTextColor={colors.subtle}
                    selectionColor={colors.accent}
                    maxLength={40}
                    returnKeyType="done"
                    onSubmitEditing={create}
                    style={styles.input}
                  />
                  <IconButton
                    name="add-outline"
                    label="Create collection"
                    onPress={create}
                    disabled={!name.trim()}
                    style={styles.createButton}
                  />
                </View>
                {library.collections.length === 0 && (
                  <View style={styles.suggestions}>
                    {['Weekend watch', 'All-time favourites', 'Watch with friends'].map(
                      (suggestion) => (
                        <Pressable
                          key={suggestion}
                          accessibilityRole="button"
                          accessibilityLabel={`Use collection name ${suggestion}`}
                          onPress={() => setName(suggestion)}
                          style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                        >
                          <AppText style={styles.suggestionText}>{suggestion}</AppText>
                        </Pressable>
                      ),
                    )}
                  </View>
                )}
              </View>
            )}
            {tab === 'ratings' && ready && ratings.length > 0 && (
              <AppText style={styles.listNote}>
                Most recently rated first · Tap a title to edit your review
              </AppText>
            )}
            {tab === 'stats' && ready && <CinemaStats />}
          </>
        }
        renderItem={({ item }) => {
          if ('value' in item) return <RatingRow rating={item} />;
          return (
            <View style={styles.collectionRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.name}, ${item.movies.length} titles`}
                onPress={() =>
                  router.push({ pathname: '/collection/[id]', params: { id: item.id } })
                }
                style={({ pressed }) => [styles.collectionLink, pressed && styles.pressed]}
              >
                <View style={styles.collectionArt}>
                  {item.movies[0] ? (
                    <Poster movie={item.movies[0]} />
                  ) : (
                    <Icon name="albums-outline" size={30} color={colors.accent} />
                  )}
                </View>
                <View style={styles.rowInfo}>
                  <AppText style={styles.rowTitle}>{item.name}</AppText>
                  <AppText style={styles.note}>
                    {item.movies.length} {item.movies.length === 1 ? 'title' : 'titles'} ·{' '}
                    {item.movies.length ? 'Made by you' : 'Ready for a story'}
                  </AppText>
                </View>
                <Icon name="chevron-forward-outline" size={18} color={colors.muted} />
              </Pressable>
              <IconButton
                name="trash-outline"
                label={`Delete collection ${item.name}`}
                onPress={() => {
                  setRemoved(library.deleteCollection(item.id));
                  setError(null);
                }}
                style={styles.remove}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          !ready ? (
            failed ? (
              <StateView
                icon="alert-circle-outline"
                title="Your library needs a moment."
                description="Your saved data is unchanged. Retry to open it."
                action="Retry"
                onAction={() => {
                  library.retrySave();
                  watchlist.retrySave();
                }}
              />
            ) : (
              <View style={styles.loading}>
                <ActivityIndicator
                  color={colors.accent}
                  accessibilityLabel="Opening your personal library"
                />
              </View>
            )
          ) : tab === 'collections' ? (
            <StateView
              icon="albums-outline"
              title="Every list tells a story."
              description="Create your first collection above. Then add movies and series from their detail pages."
              compact
            />
          ) : tab === 'ratings' ? (
            <StateView
              icon="star-outline"
              title="What stayed with you?"
              description="Give a movie or series your own 1–5 star rating. Your personal reviews will live here."
              action="Explore titles"
              onAction={() => router.navigate('/')}
            />
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: 24,
      paddingBottom: 48,
      width: '100%',
      maxWidth: 1000,
      alignSelf: 'center',
      flexGrow: 1,
    },
    deviceNote: { flexDirection: 'row', alignItems: 'center', gap: 7, marginVertical: 24 },
    note: { color: colors.muted, fontSize: 12, lineHeight: 19 },
    tabs: { flexDirection: 'row', gap: 6, marginBottom: 24 },
    tab: {
      flex: 1,
      minHeight: 50,
      paddingHorizontal: 6,
      borderRadius: 25,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeTab: { backgroundColor: colors.accent },
    tabText: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18 },
    activeTabText: { color: colors.onAccent },
    sectionTitle: {
      fontFamily: fonts.display,
      fontSize: 28,
      lineHeight: 34,
      marginTop: 12,
      marginBottom: 10,
    },
    createForm: { marginBottom: 22 },
    label: { fontFamily: fonts.medium, fontSize: 13, marginTop: 8, marginBottom: 8 },
    createRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    input: {
      flex: 1,
      minWidth: 0,
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: 10,
      color: colors.text,
      paddingVertical: 12,
      paddingHorizontal: 14,
      fontFamily: fonts.regular,
      fontSize: 15,
    },
    createButton: { backgroundColor: colors.raised },
    suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    suggestion: {
      minHeight: 48,
      paddingHorizontal: 12,
      justifyContent: 'center',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestionText: { color: colors.muted, fontSize: 12 },
    collectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 20,
      gap: 4,
    },
    collectionLink: { flex: 1, flexDirection: 'row', gap: 16, alignItems: 'center' },
    collectionArt: {
      width: 60,
      minHeight: 90,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    poster: {
      width: 60,
      height: 90,
      backgroundColor: colors.raised,
      borderRadius: 8,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowInfo: { flex: 1, gap: 5 },
    rowTitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
    remove: { backgroundColor: 'transparent' },
    listNote: { color: colors.muted, fontSize: 12, marginBottom: 6 },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    ratingLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    stats: { paddingBottom: 20 },
    statTable: { marginTop: 18, marginBottom: 28 },
    statRow: {
      minHeight: 54,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 20,
      paddingVertical: 12,
    },
    statLabel: { fontSize: 14, flexShrink: 1 },
    statValue: { fontFamily: fonts.semibold, fontSize: 15, color: colors.accent, flexShrink: 0 },
    genreList: { marginTop: 12, marginBottom: 28, gap: 18 },
    genre: { gap: 8 },
    genreHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 20 },
    track: { height: 5, borderRadius: 3, backgroundColor: colors.raised, overflow: 'hidden' },
    bar: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
    emptyNote: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 23,
      marginBottom: 24,
      flexShrink: 1,
    },
    statsEmpty: { flexDirection: 'row', gap: 12, marginTop: 8 },
    loading: { paddingVertical: 64 },
    pressed: { opacity: 0.65 },
  });
