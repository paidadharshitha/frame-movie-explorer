import { memo } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Movie } from '../types/movie';
import { colors, fonts } from '../theme';
import { useFavourites } from '../state';
import { AppText, Icon, Rating } from './ui';

export const MovieCard = memo(function MovieCard({
  movie,
  width,
}: {
  movie: Movie;
  width: number;
}) {
  const { isFavourite, toggleFavourite, isHydrated } = useFavourites();
  const saved = isFavourite(movie.id);
  return (
    <View style={{ width }}>
      <View style={styles.posterWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${movie.title}${movie.year ? `, ${movie.year}` : ''}`}
          onPress={() => router.push({ pathname: '/movie/[id]', params: { id: movie.id } })}
          style={({ pressed }) => [styles.posterButton, pressed && { opacity: 0.8 }]}
        >
          <View style={styles.placeholder}>
            <Icon name="film-outline" size={34} color={colors.subtle} />
            <AppText numberOfLines={3} style={styles.placeholderTitle}>
              {movie.title}
            </AppText>
          </View>
          {movie.posterUrl && (
            <Image
              source={{ uri: movie.posterUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={160}
              recyclingKey={movie.id}
              accessibilityIgnoresInvertColors
            />
          )}
          <View style={styles.score}>
            <Rating value={movie.rating} />
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${saved ? 'Remove' : 'Save'} ${movie.title}${saved ? ' from' : ' to'} favourites`}
          accessibilityState={{ selected: saved, disabled: !isHydrated }}
          disabled={!isHydrated}
          onPress={() => toggleFavourite(movie)}
          style={({ pressed }) => [styles.save, pressed && { opacity: 0.7 }]}
        >
          <Icon
            name={saved ? 'bookmark' : 'bookmark-outline'}
            color={saved ? colors.accent : colors.text}
            size={21}
          />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${movie.title}`}
        onPress={() => router.push({ pathname: '/movie/[id]', params: { id: movie.id } })}
        style={styles.caption}
      >
        <AppText numberOfLines={2} style={styles.title}>
          {movie.title}
        </AppText>
        <AppText numberOfLines={1} style={styles.meta}>
          {[movie.year, movie.genres[0]].filter(Boolean).join(' · ') || 'Film'}
        </AppText>
      </Pressable>
    </View>
  );
});
const styles = StyleSheet.create({
  posterWrap: {
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.raised,
  },
  posterButton: { flex: 1 },
  placeholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  placeholderTitle: { textAlign: 'center', color: colors.muted, fontSize: 12 },
  score: { position: 'absolute', top: 10, left: 10 },
  save: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,21,18,0.88)',
  },
  caption: { paddingTop: 10, minHeight: 70 },
  title: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 3 },
});
