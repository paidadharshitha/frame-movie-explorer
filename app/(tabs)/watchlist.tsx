import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWatchlist } from '../../src/state/WatchlistProvider';
import type { WatchlistEntry, WatchlistStatus } from '../../src/state/watchlist-store';
import { ScreenHeader, StatusNotices, screenStyles } from '../../src/components/Shell';
import { AppText, Icon, IconButton, StateView } from '../../src/components/ui';
import { colors, fonts } from '../../src/theme';

const WatchlistRow = memo(function WatchlistRow({
  entry,
  wide,
  onChangeStatus,
  onRemove,
}: {
  entry: WatchlistEntry;
  wide: boolean;
  onChangeStatus: (entry: WatchlistEntry) => void;
  onRemove: (entry: WatchlistEntry) => void;
}) {
  const { movie, status, watchedAt } = entry;
  return (
    <View style={[styles.row, wide && styles.wideRow]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${movie.title}`}
        onPress={() => router.push({ pathname: '/movie/[id]', params: { id: movie.id } })}
        style={({ pressed }) => [styles.film, pressed && styles.pressed]}
      >
        <View style={styles.poster}>
          <Icon name="film-outline" color={colors.subtle} size={28} />
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
        <View style={styles.filmInfo}>
          <AppText numberOfLines={3} style={styles.filmTitle}>
            {movie.title}
          </AppText>
          <AppText numberOfLines={2} style={styles.metadata}>
            {[movie.year, movie.genres[0], movie.runtime].filter(Boolean).join(' · ') || 'Film'}
          </AppText>
          <View style={styles.lastLine}>
            <Icon
              name={status === 'watched' ? 'checkmark-circle-outline' : 'star'}
              color={colors.accent}
              size={14}
            />
            <AppText style={styles.statusText}>
              {status === 'watched' && watchedAt !== undefined
                ? `Watched ${new Date(watchedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                : movie.rating !== null
                  ? `${movie.rating.toFixed(1)} / 10`
                  : 'Not yet rated'}
            </AppText>
          </View>
        </View>
      </Pressable>
      <View style={[styles.rowActions, wide && styles.wideActions]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${status === 'planned' ? 'Mark' : 'Move'} ${movie.title} ${status === 'planned' ? 'as watched' : 'to planned'}`}
          onPress={() => onChangeStatus(entry)}
          style={({ pressed }) => [styles.statusAction, pressed && styles.pressed]}
        >
          <Icon
            name={status === 'planned' ? 'checkmark-outline' : 'arrow-undo-outline'}
            color={colors.accent}
            size={18}
          />
          <AppText style={styles.actionText}>
            {status === 'planned' ? 'Mark as watched' : 'Watch later'}
          </AppText>
        </Pressable>
        <IconButton
          name="close-outline"
          label={`Remove ${movie.title} from watchlist`}
          onPress={() => onRemove(entry)}
          style={styles.removeAction}
        />
      </View>
    </View>
  );
});

export default function WatchlistScreen() {
  const { entries, isHydrated, storageError, setStatus, removeMovie, restoreEntry } =
    useWatchlist();
  const [filter, setFilter] = useState<WatchlistStatus>('planned');
  const [removed, setRemoved] = useState<WatchlistEntry | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  const plannedCount = entries.filter((entry) => entry.status === 'planned').length;
  const watchedCount = entries.length - plannedCount;
  const visibleEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.status === filter)
        .sort((a, b) =>
          filter === 'watched' ? (b.watchedAt ?? 0) - (a.watchedAt ?? 0) : b.addedAt - a.addedAt,
        ),
    [entries, filter],
  );
  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );
  const onRemove = useCallback(
    (entry: WatchlistEntry) => {
      removeMovie(entry.movie.id);
      setRemoved(entry);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setRemoved(null), 8000);
    },
    [removeMovie],
  );
  const onChangeStatus = useCallback(
    (entry: WatchlistEntry) => {
      setStatus(entry.movie, entry.status === 'planned' ? 'watched' : 'planned');
    },
    [setStatus],
  );
  const renderItem = useCallback(
    ({ item }: { item: WatchlistEntry }) => (
      <WatchlistRow entry={item} wide={wide} onChangeStatus={onChangeStatus} onRemove={onRemove} />
    ),
    [wide, onChangeStatus, onRemove],
  );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={screenStyles.screen}>
      <FlatList
        data={visibleEntries}
        renderItem={renderItem}
        keyExtractor={(entry) => entry.movie.id}
        contentContainerStyle={[styles.content, removed && { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={
          <>
            <ScreenHeader search />
            <StatusNotices />
            <AppText accessibilityRole="header" style={screenStyles.title}>
              Your next{`\n`}movie night.
            </AppText>
            <AppText style={screenStyles.subtitle}>
              A place for the films you’ll see. And the ones you’ve seen.
            </AppText>
            <View style={styles.deviceNote}>
              <Icon name="phone-portrait-outline" color={colors.muted} size={15} />
              <AppText style={styles.deviceText}>Saved on this device. Ready offline.</AppText>
            </View>
            <View style={styles.tabs}>
              {(
                [
                  { value: 'planned', label: 'Planned', count: plannedCount },
                  { value: 'watched', label: 'Watched', count: watchedCount },
                ] as const
              ).map(({ value, label, count }) => (
                <Pressable
                  key={value}
                  accessibilityRole="tab"
                  accessibilityLabel={`${label}, ${count} ${count === 1 ? 'film' : 'films'}`}
                  accessibilityState={{ selected: filter === value }}
                  onPress={() => setFilter(value)}
                  style={({ pressed }) => [
                    styles.tab,
                    filter === value && styles.activeTab,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={[styles.tabText, filter === value && styles.activeTabText]}>
                    {label}
                  </AppText>
                  <AppText style={[styles.tabCount, filter === value && styles.activeTabText]}>
                    {count}
                  </AppText>
                </Pressable>
              ))}
            </View>
            {visibleEntries.length > 0 && (
              <AppText style={styles.orderNote}>
                {filter === 'planned' ? 'Recently added first' : 'Your most recent watches first'}
              </AppText>
            )}
          </>
        }
        ListEmptyComponent={
          !isHydrated && !storageError ? (
            <View style={styles.loading}>
              <ActivityIndicator
                color={colors.accent}
                accessibilityLabel="Opening your watchlist"
              />
            </View>
          ) : storageError && !isHydrated ? (
            <StateView
              icon="alert-circle-outline"
              title="Your list needs a moment."
              description="We couldn’t open the watchlist on this device. Use Retry above to recover it safely."
            />
          ) : (
            <StateView
              icon={filter === 'planned' ? 'time-outline' : 'checkmark-circle-outline'}
              title={
                filter === 'planned' ? 'Give tonight a story.' : 'The credits haven’t rolled yet.'
              }
              description={
                filter === 'planned'
                  ? 'Open a film and add it to your watchlist. Your next movie night starts there.'
                  : 'Mark a film as watched to start your own little film diary.'
              }
              action={
                filter === 'watched' && plannedCount > 0 ? 'See planned films' : 'Explore films'
              }
              onAction={() =>
                filter === 'watched' && plannedCount > 0
                  ? setFilter('planned')
                  : router.navigate('/')
              }
            />
          )
        }
        ListFooterComponent={
          visibleEntries.length > 0 ? (
            <AppText style={styles.footer}>
              {filter === 'planned'
                ? 'Great nights begin with a good film.'
                : 'Every film leaves a little something.'}
            </AppText>
          ) : undefined
        }
      />
      {removed && (
        <View style={styles.undo} accessibilityLiveRegion="polite">
          <AppText numberOfLines={2} style={styles.undoText}>
            Removed {removed.movie.title}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Undo removal of ${removed.movie.title}`}
            onPress={() => {
              restoreEntry(removed);
              setRemoved(null);
              if (undoTimer.current) clearTimeout(undoTimer.current);
            }}
            style={styles.undoButton}
          >
            <AppText style={styles.undoLabel}>Undo</AppText>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    flexGrow: 1,
  },
  deviceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 24,
    marginBottom: 24,
  },
  deviceText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 25,
    gap: 10,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeTab: { backgroundColor: colors.accent },
  tabText: { fontSize: 14, fontFamily: fonts.semibold },
  tabCount: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium },
  activeTabText: { color: colors.onAccent },
  orderNote: { color: colors.muted, fontSize: 12, marginBottom: 4 },
  row: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 14 },
  wideRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  film: { flexDirection: 'row', gap: 16, alignItems: 'center', flex: 1 },
  poster: {
    width: 72,
    height: 108,
    borderRadius: 8,
    backgroundColor: colors.raised,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filmInfo: { flex: 1, gap: 5 },
  filmTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  metadata: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  lastLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  statusText: { color: colors.muted, fontSize: 12, lineHeight: 18, flexShrink: 1 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wideActions: { width: 230 },
  statusAction: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  actionText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, flexShrink: 1 },
  removeAction: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.65 },
  loading: { paddingVertical: 64 },
  footer: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 12,
    paddingTop: 32,
    paddingBottom: 24,
  },
  undo: {
    position: 'absolute',
    bottom: 12,
    left: 24,
    right: 24,
    maxWidth: 620,
    alignSelf: 'center',
    backgroundColor: colors.raised,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 6,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  undoText: { flex: 1, fontSize: 13, lineHeight: 19, paddingVertical: 12 },
  undoButton: { minWidth: 64, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  undoLabel: { color: colors.accent, fontFamily: fonts.bold, fontSize: 13 },
});
