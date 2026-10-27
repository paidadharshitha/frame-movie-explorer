import { useCallback, useMemo, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDebouncedValue, useMovieSearch, flattenMovies } from '../../src/hooks';
import { catalog } from '../../src/api/movies';
import { useBrowse, useNetworkStatus } from '../../src/state';
import { CatalogSelector } from '../../src/components/CatalogSelector';
import { fonts, useTheme, useThemedStyles, type ThemeColors } from '../../src/theme';
import { AppText, Icon, IconButton, StateView } from '../../src/components/ui';
import { MovieGrid } from '../../src/components/MovieGrid';
import { ScreenHeader, StatusNotices, useScreenStyles } from '../../src/components/Shell';

export default function SearchScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const screenStyles = useScreenStyles();
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const field = useRef<ComponentRef<typeof TextInput>>(null);
  const term = useDebouncedValue(input.trim(), 350);
  const active = input.trim().length >= 2;
  const debouncing = active && input.trim() !== term;
  const browse = useBrowse();
  const query = useMovieSearch(term, browse);
  const { isOnline } = useNetworkStatus();
  const movies = useMemo(
    () => (active && !debouncing ? flattenMovies(query.data) : []),
    [query.data, active, debouncing],
  );
  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);
  const loadMore = useCallback(() => {
    if (!query.isFetching && !debouncing) void query.fetchNextPage();
  }, [query, debouncing]);
  const suggestions =
    browse.mediaType === 'series'
      ? catalog.id === 'jikan'
        ? ['Frieren', 'Cowboy Bebop', 'Spy x Family', 'One Piece']
        : ['Severance', 'The Bear', 'Breaking Bad', 'Dark']
      : catalog.id === 'jikan'
        ? ['Spirited Away', 'Your Name', 'Akira', 'Howl']
        : ['Interstellar', 'The Grand Budapest Hotel', 'Dune', 'Past Lives'];
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={screenStyles.screen}>
      <View style={styles.top}>
        <ScreenHeader />
        <StatusNotices />
        <AppText accessibilityRole="header" style={[screenStyles.title, { marginTop: 0 }]}>
          Find {browse.mediaType === 'series' ? 'a series' : 'a film'}.
        </AppText>
        <AppText style={screenStyles.subtitle}>
          A title in mind? Let’s find your next story.
        </AppText>
        <View style={[styles.searchBox, focused && { borderColor: colors.accent }]}>
          <Icon name="search-outline" color={colors.muted} size={21} />
          <TextInput
            ref={field}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            value={input}
            onChangeText={setInput}
            accessibilityLabel="Search movies and series"
            placeholder={
              browse.mediaType === 'series' ? 'Search series titles…' : 'Search movie titles…'
            }
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            maxLength={120}
            selectionColor={colors.accent}
            cursorColor={colors.accent}
            clearButtonMode="never"
          />
          {input.length > 0 ? (
            <IconButton
              name="close"
              label="Clear search"
              onPress={() => {
                setInput('');
                field.current?.focus();
              }}
              style={styles.clear}
            />
          ) : null}
        </View>
        <CatalogSelector />
      </View>
      <MovieGrid
        key={`search-${term}-${browse.mediaType}-${browse.language}`}
        autoLoadMore={browse.language === 'all'}
        movies={movies}
        loading={active && (debouncing || query.isPending)}
        error={active && !debouncing ? query.error : null}
        offline={active && !isOnline}
        refreshing={
          query.isRefetching && !query.isFetchingNextPage && query.fetchStatus !== 'paused'
        }
        fetchingMore={query.isFetchingNextPage && query.fetchStatus !== 'paused'}
        hasMore={active && !debouncing && query.hasNextPage}
        pageError={query.isFetchNextPageError}
        onRefresh={active && !debouncing ? refresh : undefined}
        onMore={loadMore}
        header={
          <View style={styles.resultsHeader}>
            {active ? (
              <>
                <AppText style={styles.resultsText} accessibilityLiveRegion="polite">
                  {!isOnline && !movies.length
                    ? 'Reconnect to search this collection.'
                    : debouncing || query.isPending
                      ? 'Finding your stories…'
                      : `${movies.length} ${movies.length === 1 ? 'title' : 'titles'}${query.hasNextPage ? ' and more' : ''} for “${term}”`}
                </AppText>
                {query.isFetching && !query.isPending && (
                  <ActivityIndicator size="small" color={colors.accent} />
                )}
              </>
            ) : (
              <AppText style={styles.resultsText}>
                {input.length ? 'Type at least 2 characters to search.' : 'A few places to begin'}
              </AppText>
            )}
          </View>
        }
        empty={
          active ? (
            <StateView
              icon="search-outline"
              title={
                query.hasNextPage ? 'No matches in these results.' : 'A plot twist. No results.'
              }
              description={
                query.hasNextPage
                  ? 'No titles match your language in the pages loaded so far. Load more below, or try All languages.'
                  : `We couldn’t find “${term}” in this selection. Try All languages, a shorter title or a different spelling.`
              }
              action="Clear search"
              onAction={() => {
                setInput('');
                field.current?.focus();
              }}
            />
          ) : (
            <View>
              <View style={styles.suggestions}>
                {suggestions.map((title) => (
                  <Pressable
                    key={title}
                    accessibilityRole="button"
                    onPress={() => setInput(title)}
                    style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}
                  >
                    <Icon name="arrow-up-outline" color={colors.accent} size={16} />
                    <AppText style={styles.suggestionText}>{title}</AppText>
                  </Pressable>
                ))}
              </View>
              <StateView
                icon="sparkles-outline"
                title="So many worlds to explore."
                description={
                  catalog.id === 'jikan'
                    ? 'From Studio Ghibli classics to bold new animation. Search by title to find your way in.'
                    : 'From familiar favourites to something completely unexpected. Search by title.'
                }
                compact
              />
            </View>
          )
        }
        footerLabel="That’s every match. The next story is up to you."
      />
    </SafeAreaView>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    top: { width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 24 },
    searchBox: {
      marginTop: 22,
      marginBottom: 20,
      minHeight: 56,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 16,
      gap: 11,
    },
    input: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.text,
      paddingVertical: 16,
      minHeight: 54,
      outlineWidth: 0,
    },
    clear: { backgroundColor: 'transparent', marginRight: 4 },
    resultsHeader: {
      minHeight: 40,
      paddingBottom: 16,
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    resultsText: { flex: 1, color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
    suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    suggestion: {
      minHeight: 48,
      paddingHorizontal: 16,
      borderRadius: 24,
      backgroundColor: colors.raised,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    suggestionText: { fontSize: 13 },
  });
