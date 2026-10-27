import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useMovie } from '../../src/hooks';
import { useFavourites, useNetworkStatus } from '../../src/state';
import { colors, fonts } from '../../src/theme';
import {
  AppText,
  Button,
  Icon,
  IconButton,
  InlineNotice,
  Rating,
  StateView,
} from '../../src/components/ui';
import { StatusNotices } from '../../src/components/Shell';
import { WatchlistControls } from '../../src/components/WatchlistControls';

export default function MovieDetailsScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] || '' : rawId || '';
  const query = useMovie(id);
  const { isOnline } = useNetworkStatus();
  const { isFavourite, toggleFavourite, isHydrated } = useFavourites();
  const [linkError, setLinkError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const movie = query.data;
  const saved = Boolean(movie && isFavourite(movie.id));
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const openLink = async (url: string) => {
    try {
      setLinkError(null);
      await Linking.openURL(url);
    } catch {
      setLinkError('This link couldn’t open. Please try again.');
    }
  };
  if (!movie)
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyTop}>
          <IconButton name="arrow-back" label="Go back" onPress={back} />
        </View>
        {query.isPending && isOnline ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
            <AppText style={styles.muted}>Finding the story…</AppText>
          </View>
        ) : (
          <StateView
            icon={isOnline ? 'film-outline' : 'cloud-offline-outline'}
            title={isOnline ? 'This film is out of frame.' : 'A little intermission.'}
            description={
              isOnline
                ? query.error?.message || 'This film isn’t available in the catalog.'
                : 'This film hasn’t been saved or loaded yet. Reconnect to see its story.'
            }
            action={isOnline ? 'Try again' : 'Back to films'}
            onAction={
              isOnline
                ? () => {
                    void query.refetch();
                  }
                : back
            }
          />
        )}
      </SafeAreaView>
    );
  const wide = width >= 760;
  const ratingSource = movie.provider === 'tmdb' ? 'TMDB' : 'MyAnimeList';
  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.artwork, { height: wide ? 440 : 365 }]}>
          {movie.posterUrl && (
            <Image
              source={{ uri: movie.backdropUrl || movie.posterUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition={{ top: '20%', left: '50%' }}
              blurRadius={movie.backdropUrl ? 0 : 14}
              cachePolicy="memory-disk"
            />
          )}
          <LinearGradient
            colors={['rgba(17,21,18,0.35)', 'rgba(17,21,18,0.6)', colors.background]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.detailNav}>
            <IconButton
              name="arrow-back"
              label="Go back"
              onPress={back}
              style={styles.overlayButton}
            />
            <AppText style={styles.detailNavTitle}>The story behind the film</AppText>
            <IconButton
              name={saved ? 'bookmark' : 'bookmark-outline'}
              label={saved ? 'Remove from favourites' : 'Save to favourites'}
              selected={saved}
              disabled={!isHydrated}
              onPress={() => toggleFavourite(movie)}
              style={!saved && styles.overlayButton}
            />
          </View>
          <View style={[styles.poster, { height: wide ? 300 : 250 }]}>
            <View style={styles.posterPlaceholder}>
              <Icon name="film-outline" size={48} color={colors.muted} />
            </View>
            {movie.posterUrl && (
              <Image
                source={{ uri: movie.posterUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={160}
              />
            )}
          </View>
        </View>
        <View style={styles.body}>
          <StatusNotices />
          {query.isError && (
            <InlineNotice
              message="Showing the details you already loaded. We couldn’t update them just now."
              action="Retry"
              onAction={() => {
                void query.refetch();
              }}
              warning
            />
          )}
          <AppText
            accessibilityRole="header"
            style={[styles.title, wide && { fontSize: 52, lineHeight: 58 }]}
          >
            {movie.title}
          </AppText>
          {movie.originalTitle && movie.originalTitle !== movie.title && (
            <AppText style={styles.original}>{movie.originalTitle}</AppText>
          )}
          <AppText style={styles.metadata}>
            {[movie.year, movie.runtime].filter(Boolean).join('  ·  ') ||
              'Release details unavailable'}
          </AppText>
          <View style={styles.genres}>
            {movie.genres.map((genre) => (
              <View key={genre} style={styles.genre}>
                <AppText style={styles.genreText}>{genre}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.ratingRow}>
            <View>
              <Rating value={movie.rating} large />
              <AppText style={styles.ratingSource}>
                {ratingSource} community rating
                {movie.ratingCount ? ` · ${movie.ratingCount.toLocaleString()} votes` : ''}
              </AppText>
            </View>
            <Icon name="sparkles-outline" size={25} color={colors.accent} />
          </View>
          <Button
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            secondary={saved}
            disabled={!isHydrated}
            onPress={() => toggleFavourite(movie)}
          >
            {saved ? 'Saved to favourites' : 'Save to favourites'}
          </Button>
          <AppText accessibilityLiveRegion="polite" style={styles.saveHint}>
            {saved
              ? 'A good story, kept close. Saved on this device.'
              : 'Keep this film in your collection for later.'}
          </AppText>
          <WatchlistControls movie={movie} />
          <AppText accessibilityRole="header" style={styles.sectionTitle}>
            The story
          </AppText>
          <AppText selectable style={styles.overview}>
            {movie.overview || 'The catalog hasn’t added a synopsis for this film yet.'}
          </AppText>
          {linkError && <InlineNotice message={linkError} warning />}
          <View style={styles.links}>
            {movie.trailerUrl && (
              <Button
                icon="play-outline"
                secondary
                onPress={() => {
                  void openLink(movie.trailerUrl!);
                }}
              >
                Watch trailer
              </Button>
            )}
            {movie.sourceUrl && (
              <Button
                icon="open-outline"
                secondary
                onPress={() => {
                  void openLink(movie.sourceUrl!);
                }}
              >
                View on {ratingSource}
              </Button>
            )}
          </View>
          <AppText style={styles.credit}>
            Film information and artwork via{' '}
            {movie.provider === 'tmdb' ? 'TMDB' : 'Tenrai / MyAnimeList'}. Ratings are out of 10.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { maxWidth: 1100, width: '100%', alignSelf: 'center', paddingBottom: 40 },
  artwork: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  detailNav: {
    position: 'absolute',
    top: 14,
    left: 20,
    right: 20,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  overlayButton: { backgroundColor: 'rgba(17,21,18,0.8)' },
  detailNavTitle: { fontSize: 12, color: colors.text, flex: 1, textAlign: 'center' },
  poster: {
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.raised,
  },
  posterPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  body: { paddingHorizontal: 24, maxWidth: 750, alignSelf: 'center', width: '100%' },
  title: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 45,
    textAlign: 'center',
    marginTop: 8,
  },
  original: { textAlign: 'center', color: colors.muted, fontSize: 13, marginTop: 6 },
  metadata: { textAlign: 'center', color: colors.muted, fontSize: 13, marginTop: 12 },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  genre: {
    borderRadius: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  genreText: { fontSize: 11, lineHeight: 17, color: colors.muted },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 26,
  },
  ratingSource: { color: colors.muted, fontSize: 11, marginTop: 3 },
  saveHint: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 10,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    lineHeight: 30,
    marginTop: 32,
    marginBottom: 12,
  },
  overview: { fontSize: 15, lineHeight: 26, color: '#C4CDBF' },
  links: { marginTop: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  credit: { color: colors.muted, fontSize: 10, lineHeight: 17, marginTop: 32, textAlign: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  muted: { color: colors.muted },
  emptyTop: { padding: 20 },
});
