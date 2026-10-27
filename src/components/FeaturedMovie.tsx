import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Movie } from '../types/movie';
import { fonts, useTheme, useThemedStyles, type ThemeColors } from '../theme';
import { AppText, Icon, Rating } from './ui';

export function FeaturedMovie({ movie, personal = false }: { movie: Movie; personal?: boolean }) {
  const { reduceMotion } = useTheme();
  const styles = useThemedStyles(createStyles);
  const wide = useWindowDimensions().width >= 700;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Explore featured title ${movie.title}`}
      onPress={() => router.push({ pathname: '/movie/[id]', params: { id: movie.id } })}
      style={({ pressed }) => [
        styles.hero,
        { height: wide ? 360 : 270 },
        pressed && { opacity: 0.9 },
      ]}
    >
      {movie.posterUrl && (
        <Image
          source={{ uri: movie.backdropUrl || movie.posterUrl }}
          style={[StyleSheet.absoluteFill, wide && !movie.backdropUrl && { left: '36%' }]}
          contentFit="cover"
          contentPosition={{ top: '25%', left: '50%' }}
          cachePolicy="memory-disk"
          transition={reduceMotion ? 0 : 200}
        />
      )}
      <LinearGradient
        colors={['rgba(12,18,13,0.05)', 'rgba(12,18,13,0.4)', 'rgba(12,18,13,0.98)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      {wide && (
        <LinearGradient
          colors={['#172218', 'rgba(23,34,24,0.85)', 'rgba(23,34,24,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.heroTop}>
        <View style={styles.featuredTag}>
          <Icon name="sparkles-outline" color="#D5ED86" size={14} />
          <AppText style={styles.tagText}>
            {personal ? 'Your next story' : 'In the spotlight'}
          </AppText>
        </View>
        <Rating value={movie.rating} />
      </View>
      <View style={[styles.heroContent, wide && { maxWidth: '65%', padding: 32 }]}>
        <AppText numberOfLines={2} style={[styles.title, wide && { fontSize: 48, lineHeight: 52 }]}>
          {movie.title}
        </AppText>
        <AppText style={styles.meta}>
          {[movie.year, ...movie.genres.slice(0, 2)].filter(Boolean).join('  ·  ')}
        </AppText>
        {wide && (
          <AppText numberOfLines={2} style={styles.overview}>
            {movie.overview}
          </AppText>
        )}
        <View style={styles.heroAction}>
          <AppText style={styles.actionText}>Discover the story</AppText>
          <Icon name="arrow-forward" size={18} color="#D5ED86" />
        </View>
      </View>
    </Pressable>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    hero: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      justifyContent: 'space-between',
      marginTop: 16,
      marginBottom: 12,
    },
    heroTop: {
      padding: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    featuredTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(17,21,18,0.85)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    tagText: { fontSize: 11, fontFamily: fonts.medium, color: '#F5F3E9', lineHeight: 16 },
    heroContent: { padding: 22, paddingTop: 0 },
    title: { fontFamily: fonts.display, fontSize: 38, lineHeight: 40, color: '#FFFFFF' },
    meta: { color: '#D5DBCE', fontSize: 12, marginTop: 8 },
    overview: { color: '#CBD4C6', fontSize: 13, lineHeight: 20, marginTop: 12, maxWidth: 420 },
    heroAction: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14 },
    actionText: { color: '#D5ED86', fontFamily: fonts.semibold, fontSize: 12 },
  });
