import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavourites } from '../../src/state';
import { fonts, useTheme, useThemedStyles, type ThemeColors } from '../../src/theme';
import { AppText, Icon, StateView } from '../../src/components/ui';
import { ScreenHeader, StatusNotices, useScreenStyles } from '../../src/components/Shell';
import { MovieGrid } from '../../src/components/MovieGrid';

export default function FavouritesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const screenStyles = useScreenStyles();
  const { favourites, isHydrated, storageError } = useFavourites();
  const [sort, setSort] = useState<'recent' | 'title'>('recent');
  const movies = useMemo(
    () =>
      sort === 'title'
        ? [...favourites].sort((a, b) => a.title.localeCompare(b.title))
        : favourites,
    [favourites, sort],
  );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={screenStyles.screen}>
      <MovieGrid
        movies={movies}
        header={
          <>
            <ScreenHeader />
            <StatusNotices />
            <AppText accessibilityRole="header" style={screenStyles.title}>
              Good stories,{`\n`}worth keeping.
            </AppText>
            <AppText style={screenStyles.subtitle}>
              Your own little collection. Always close at hand.
            </AppText>
            <View style={styles.collectionInfo}>
              <View style={styles.count}>
                <Icon name="bookmark-outline" size={17} color={colors.accent} />
                <AppText style={styles.countText}>
                  {favourites.length} {favourites.length === 1 ? 'saved film' : 'saved films'}
                </AppText>
              </View>
              <View style={styles.local}>
                <Icon name="phone-portrait-outline" size={14} color={colors.muted} />
                <AppText style={styles.localText}>On this device</AppText>
              </View>
            </View>
            {movies.length > 0 && (
              <View style={styles.sortRow}>
                {(
                  [
                    { key: 'recent', label: 'Recently saved' },
                    { key: 'title', label: 'A–Z' },
                  ] as const
                ).map(({ key, label }) => (
                  <Pressable
                    key={key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: sort === key }}
                    onPress={() => setSort(key)}
                    style={[styles.sortButton, sort === key && styles.sortActive]}
                  >
                    <AppText style={[styles.sortText, sort === key && { color: colors.onAccent }]}>
                      {label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        }
        empty={
          !isHydrated && !storageError ? (
            <View style={{ padding: 64 }}>
              <ActivityIndicator
                color={colors.accent}
                accessibilityLabel="Opening your favourites"
              />
            </View>
          ) : storageError && !isHydrated ? (
            <StateView
              icon="alert-circle-outline"
              title="Your collection needs a moment."
              description="We couldn’t read the saved films on this device. Use Retry above to safely try again."
            />
          ) : (
            <StateView
              icon="bookmarks-outline"
              title="Make room for a favourite."
              description="Found a film that speaks to you? Tap the bookmark to keep it here, even when you’re offline."
              action="Explore films"
              onAction={() => router.navigate('/')}
            />
          )
        }
        footerLabel="A collection with your name on it."
      />
    </SafeAreaView>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    collectionInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      paddingVertical: 24,
      marginTop: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 24,
    },
    count: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    countText: { fontSize: 13, fontFamily: fonts.medium },
    local: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    localText: { fontSize: 11, color: colors.muted },
    sortRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    sortButton: {
      minHeight: 48,
      paddingHorizontal: 18,
      borderRadius: 24,
      backgroundColor: colors.surface,
      justifyContent: 'center',
    },
    sortActive: { backgroundColor: colors.accent },
    sortText: { fontFamily: fonts.medium, fontSize: 13 },
  });
