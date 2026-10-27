import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { catalog } from '../../src/api/movies';
import { useMovies, flattenMovies } from '../../src/hooks';
import { useNetworkStatus } from '../../src/state';
import type { SortOrder } from '../../src/types/movie';
import { colors, fonts } from '../../src/theme';
import { AppText, IconButton, StateView } from '../../src/components/ui';
import { ScreenHeader, StatusNotices, screenStyles } from '../../src/components/Shell';
import { MovieGrid } from '../../src/components/MovieGrid';
import { FeaturedMovie } from '../../src/components/FeaturedMovie';

export default function DiscoverScreen() {
  const [sort, setSort] = useState<SortOrder>('popular');
  const query = useMovies(sort);
  const movies = useMemo(() => flattenMovies(query.data), [query.data]);
  const { isOnline } = useNetworkStatus();
  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);
  const loadMore = useCallback(() => {
    if (!query.isFetching) void query.fetchNextPage();
  }, [query]);
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={screenStyles.screen}>
      <MovieGrid
        movies={movies}
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
              Find your next{`\n`}favourite film.
            </AppText>
            <AppText style={screenStyles.subtitle}>
              {catalog.id === 'jikan'
                ? 'Extraordinary worlds. Unforgettable stories. Explore animated cinema.'
                : 'Extraordinary worlds. Unforgettable stories. Explore world cinema.'}
            </AppText>
            {movies[0] && <FeaturedMovie movie={movies[0]} />}
            <View style={[styles.section, !movies.length && { marginTop: 30 }]}>
              <AppText accessibilityRole="header" style={styles.sectionTitle}>
                The collection
              </AppText>
              <IconButton
                name="refresh-outline"
                label="Refresh movies"
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
                  onPress={() => setSort(item.value)}
                  style={[styles.filter, sort === item.value && styles.filterActive]}
                >
                  <AppText
                    style={[styles.filterText, sort === item.value && styles.filterTextActive]}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              ))}
              <View style={{ flex: 1 }} />
              <AppText style={styles.catalogLabel}>{catalog.name}</AppText>
            </View>
          </>
        }
        empty={
          <StateView
            icon="film-outline"
            title="No films here just yet."
            description="The catalog is taking an intermission. Try refreshing in a moment."
            action="Refresh"
            onAction={refresh}
          />
        }
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
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
    marginBottom: 24,
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
});
