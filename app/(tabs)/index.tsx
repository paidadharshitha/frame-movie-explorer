import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { catalog } from '../../src/api/movies';
import { useMovies, flattenMovies } from '../../src/hooks';
import { useBrowse, useFavourites, useNetworkStatus, useWatchlist } from '../../src/state';
import { CatalogSelector } from '../../src/components/CatalogSelector';
import type { SortOrder } from '../../src/types/movie';
import { fonts, useTheme, useThemedStyles, type ThemeColors } from '../../src/theme';
import { AppText, Button, Icon, IconButton, StateView } from '../../src/components/ui';
import { ScreenHeader, StatusNotices, useScreenStyles } from '../../src/components/Shell';
import { MovieGrid } from '../../src/components/MovieGrid';
import { FeaturedMovie } from '../../src/components/FeaturedMovie';
import { CollectionFilters } from '../../src/components/CollectionFilters';
import {
  availableGenres,
  chooseSurprise,
  filterMovies,
  type MovieFilters,
  type SurprisePick,
} from '../../src/lib/discovery';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const screenStyles = useScreenStyles();
  const [sort, setSort] = useState<SortOrder>('popular');
  const [filters, setFilters] = useState<MovieFilters>({ genre: null, minimumRating: null });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hideWatched, setHideWatched] = useState(false);
  const [pick, setPick] = useState<SurprisePick | null>(null);
  const [pickMessage, setPickMessage] = useState<string | null>(null);
  const browse = useBrowse();
  const query = useMovies(sort, browse);
  const movies = useMemo(() => flattenMovies(query.data), [query.data]);
  const { isOnline } = useNetworkStatus();
  const { favourites, isHydrated: favouritesReady } = useFavourites();
  const { entries, isHydrated: watchlistReady } = useWatchlist();
  const watchedIds = useMemo(
    () =>
      new Set(entries.filter((entry) => entry.status === 'watched').map((entry) => entry.movie.id)),
    [entries],
  );
  const genres = useMemo(() => availableGenres(movies), [movies]);
  const filteredMovies = useMemo(
    () =>
      filterMovies(movies, filters).filter((movie) => !hideWatched || !watchedIds.has(movie.id)),
    [movies, filters, hideWatched, watchedIds],
  );
  const activeFilters =
    Number(Boolean(filters.genre)) + Number(filters.minimumRating !== null) + Number(hideWatched);
  const currentPick =
    pick &&
    filteredMovies.some((movie) => movie.id === pick.movie.id) &&
    !watchedIds.has(pick.movie.id)
      ? pick
      : null;
  const featured = currentPick?.movie ?? filteredMovies[0];
  const surprise = () => {
    const next = chooseSurprise({
      movies: filteredMovies,
      favourites,
      watchedIds,
      previousId: featured?.id,
    });
    setPick(next);
    setPickMessage(
      next
        ? null
        : 'Every title in this selection is already watched. Load more titles or change your filters for a new pick.',
    );
  };
  const clearFilters = () => {
    setFilters({ genre: null, minimumRating: null });
    setHideWatched(false);
    setPickMessage(null);
  };
  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);
  const loadMore = useCallback(() => {
    if (!query.isFetching) void query.fetchNextPage();
  }, [query]);
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={screenStyles.screen}>
      <MovieGrid
        key={`${browse.mediaType}-${browse.language}-${sort}`}
        movies={filteredMovies}
        hasLoadedContent={movies.length > 0}
        autoLoadMore={activeFilters === 0}
        loading={query.isPending}
        error={query.error}
        offline={!isOnline}
        refreshing={
          query.isRefetching && !query.isFetchingNextPage && query.fetchStatus !== 'paused'
        }
        fetchingMore={query.isFetchingNextPage && query.fetchStatus !== 'paused'}
        hasMore={query.hasNextPage}
        pageError={query.isFetchNextPageError}
        onRefresh={refresh}
        onMore={loadMore}
        header={
          <>
            <ScreenHeader search />
            <StatusNotices />
            <AppText accessibilityRole="header" style={screenStyles.title}>
              Find your next{`\n`}favourite {browse.mediaType === 'series' ? 'series' : 'film'}.
            </AppText>
            <AppText style={screenStyles.subtitle}>
              {catalog.id === 'jikan'
                ? 'Extraordinary worlds. Unforgettable stories. Explore animated cinema.'
                : 'Extraordinary worlds. Unforgettable stories. Explore world cinema.'}
            </AppText>
            <View style={{ marginTop: 24 }}>
              <CatalogSelector />
            </View>
            {movies.length > 0 && (
              <>
                <View style={styles.pickRow}>
                  <View style={styles.pickCopy}>
                    <AppText style={styles.pickTitle}>Let the story find you.</AppText>
                    <AppText style={styles.pickCaption}>
                      A little less scrolling. A little more cinema.
                    </AppText>
                  </View>
                  <Button
                    icon="shuffle"
                    onPress={surprise}
                    disabled={!favouritesReady || !watchlistReady || !filteredMovies.length}
                    style={styles.surpriseButton}
                  >
                    {currentPick ? 'Pick again' : 'Surprise me'}
                  </Button>
                </View>
                {featured && <FeaturedMovie movie={featured} personal={Boolean(currentPick)} />}
                <AppText accessibilityLiveRegion="polite" style={styles.pickReason}>
                  {pickMessage ??
                    currentPick?.reason ??
                    'Picks use your favourite genres and skip titles you’ve watched.'}
                </AppText>
              </>
            )}
            <View style={[styles.section, { marginTop: 24 }]}>
              <AppText accessibilityRole="header" style={styles.sectionTitle}>
                The collection
              </AppText>
              <IconButton
                name="refresh-outline"
                label="Refresh titles"
                onPress={refresh}
                disabled={query.isFetching || !isOnline}
                style={{ backgroundColor: 'transparent' }}
              />
            </View>
            <View style={styles.filters}>
              {(
                [
                  { value: 'popular', label: 'Popular' },
                  { value: 'top-rated', label: 'Top rated' },
                ] as const
              ).map((item) => (
                <Pressable
                  key={item.value}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: sort === item.value }}
                  onPress={() => {
                    setSort(item.value);
                    setPick(null);
                    setPickMessage(null);
                  }}
                  style={[styles.filter, sort === item.value && styles.filterActive]}
                >
                  <AppText
                    style={[styles.filterText, sort === item.value && styles.filterTextActive]}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={filtersOpen ? 'Close filters' : 'Open filters'}
                accessibilityState={{ expanded: filtersOpen }}
                onPress={() => setFiltersOpen(!filtersOpen)}
                style={[styles.filterToggle, activeFilters > 0 && styles.filterSelected]}
              >
                <Icon
                  name="options-outline"
                  size={18}
                  color={activeFilters ? colors.accent : colors.text}
                />
                <AppText style={[styles.filterText, activeFilters > 0 && { color: colors.accent }]}>
                  Filters{activeFilters > 0 ? ` · ${activeFilters}` : ''}
                </AppText>
              </Pressable>
            </View>
            {filtersOpen && (
              <CollectionFilters
                genres={genres}
                filters={filters}
                onChange={(next) => {
                  setFilters(next);
                  setPickMessage(null);
                }}
                hideWatched={hideWatched}
                onHideWatchedChange={setHideWatched}
              />
            )}
            <View style={styles.scopeRow}>
              <AppText style={styles.catalogLabel}>
                {activeFilters
                  ? `${filteredMovies.length} of ${movies.length} loaded titles · filters apply locally`
                  : catalog.name}
              </AppText>
              {activeFilters > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear filters"
                  onPress={clearFilters}
                  style={styles.clearButton}
                >
                  <AppText style={styles.clearText}>Clear</AppText>
                </Pressable>
              )}
            </View>
          </>
        }
        empty={
          activeFilters && movies.length > 0 ? (
            <StateView
              icon="options-outline"
              title="A different kind of story?"
              description={
                query.hasNextPage
                  ? 'No matches in the titles loaded so far. Clear your filters or load another page below.'
                  : 'No loaded titles match these filters. Try another genre or include titles you’ve already watched.'
              }
              action="Clear filters"
              onAction={clearFilters}
            />
          ) : (
            <StateView
              icon="film-outline"
              title="No films here just yet."
              description="The catalog is taking an intermission. Try refreshing in a moment."
              action="Refresh"
              onAction={refresh}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    sectionTitle: { fontSize: 23, lineHeight: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    filter: {
      minHeight: 48,
      paddingHorizontal: 18,
      justifyContent: 'center',
      borderRadius: 24,
      backgroundColor: colors.surface,
    },
    filterActive: { backgroundColor: colors.accent },
    filterText: { fontSize: 13, fontFamily: fonts.medium, color: colors.muted },
    filterTextActive: { color: colors.onAccent, fontFamily: fonts.bold },
    catalogLabel: { fontSize: 11, color: colors.muted },
    pickRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 14,
      marginTop: 26,
    },
    pickCopy: { flex: 1, minWidth: 180 },
    pickTitle: { fontFamily: fonts.display, fontSize: 25, lineHeight: 30 },
    pickCaption: { fontSize: 11, lineHeight: 17, color: colors.muted, marginTop: 4 },
    surpriseButton: { paddingHorizontal: 16 },
    pickReason: { fontSize: 11, lineHeight: 18, color: colors.muted, paddingHorizontal: 2 },
    filterToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterSelected: { borderColor: colors.selectionBorder, backgroundColor: colors.selection },
    scopeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
      gap: 8,
      marginBottom: 12,
    },
    clearButton: { minHeight: 48, paddingHorizontal: 8, justifyContent: 'center' },
    clearText: { color: colors.accent, fontSize: 12, fontFamily: fonts.medium },
  });
