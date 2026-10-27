import { memo, useCallback, useMemo, type ReactElement } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors, fonts } from '../theme';
import type { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';
import { AppText, Button, InlineNotice, StateView } from './ui';

export function useGridLayout() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - (width >= 1000 ? 216 : 0), 1180);
  const columns = contentWidth >= 900 ? 4 : contentWidth >= 620 ? 3 : 2;
  return { columns, itemWidth: (contentWidth - 48 - (columns - 1) * 16) / columns };
}
export function GridSkeleton() {
  const { itemWidth } = useGridLayout();
  return (
    <View
      accessibilityLabel="Loading films"
      accessibilityRole="progressbar"
      style={styles.skeletonWrap}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <View key={i} style={{ width: itemWidth, gap: 10 }}>
          <View style={[styles.skeleton, { aspectRatio: 2 / 3 }]} />
          <View style={[styles.skeleton, { height: 13, width: '80%' }]} />
          <View style={[styles.skeleton, { height: 10, width: '50%', marginBottom: 16 }]} />
        </View>
      ))}
    </View>
  );
}

type Props = {
  movies: Movie[];
  header: ReactElement;
  loading?: boolean;
  error?: Error | null;
  offline?: boolean;
  refreshing?: boolean;
  fetchingMore?: boolean;
  hasMore?: boolean;
  pageError?: boolean;
  onRefresh?: () => void;
  onMore?: () => void;
  empty?: ReactElement;
  footerLabel?: string;
};
export const MovieGrid = memo(function MovieGrid({
  movies,
  header,
  loading,
  error,
  offline,
  refreshing,
  fetchingMore,
  hasMore,
  pageError,
  onRefresh,
  onMore,
  empty,
  footerLabel,
}: Props) {
  const { columns, itemWidth } = useGridLayout();
  const renderItem = useCallback(
    ({ item }: { item: Movie }) => <MovieCard movie={item} width={itemWidth} />,
    [itemWidth],
  );
  const keyExtractor = useCallback((item: Movie) => item.id, []);
  const handleEndReached = useCallback(() => {
    if (hasMore && !loading && !refreshing && !fetchingMore && !pageError && !offline) onMore?.();
  }, [hasMore, loading, refreshing, fetchingMore, pageError, offline, onMore]);
  const headerContent = useMemo(
    () => (
      <>
        {header}
        {error && movies.length > 0 && !pageError && (
          <InlineNotice
            message="Couldn't update the collection. Your loaded films are still here."
            action="Retry"
            onAction={onRefresh}
            warning
          />
        )}
      </>
    ),
    [header, error, movies.length, pageError, onRefresh],
  );
  const emptyContent =
    loading && !offline ? (
      <GridSkeleton />
    ) : error || offline ? (
      <StateView
        icon={offline ? 'cloud-offline-outline' : 'film-outline'}
        title={offline ? 'A little intermission.' : 'The films couldn’t load.'}
        description={
          offline
            ? 'Reconnect to load this collection. You can still visit films saved in your Favourites.'
            : error?.message || 'Check your connection and try again.'
        }
        action={offline ? undefined : 'Try again'}
        onAction={onRefresh}
      />
    ) : (
      empty
    );
  return (
    <FlatList<Movie>
      key={`grid-${columns}`}
      data={movies}
      numColumns={columns}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={headerContent}
      ListEmptyComponent={emptyContent}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      style={styles.list}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.45}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.onAccent]}
            progressBackgroundColor={colors.accent}
          />
        ) : undefined
      }
      ListFooterComponent={
        <View style={styles.footer}>
          {fetchingMore ? (
            <ActivityIndicator color={colors.accent} accessibilityLabel="Loading more films" />
          ) : pageError ? (
            <>
              <AppText style={styles.footerText}>The next films couldn’t load.</AppText>
              <Button onPress={() => onMore?.()} secondary icon="refresh">
                Try again
              </Button>
            </>
          ) : movies.length > 0 ? (
            <>
              <View style={styles.endMark} />
              <AppText style={styles.footerText}>
                {hasMore
                  ? offline
                    ? 'Reconnect to discover more films.'
                    : 'More stories, just a scroll away.'
                  : footerLabel || 'You’ve reached the end of this collection.'}
              </AppText>
              {hasMore && !offline && (
                <Button onPress={() => onMore?.()} secondary icon="add">
                  Load more films
                </Button>
              )}
            </>
          ) : null}
        </View>
      }
    />
  );
});
const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxWidth: 1180,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  row: { gap: 16, marginBottom: 20 },
  skeletonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  skeleton: { backgroundColor: colors.raised, borderRadius: 12 },
  footer: { paddingTop: 16, paddingBottom: 28, alignItems: 'center', gap: 16 },
  footerText: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, textAlign: 'center' },
  endMark: { width: 24, height: 2, backgroundColor: colors.border, marginBottom: 2 },
});
