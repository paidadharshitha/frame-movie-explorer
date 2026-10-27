import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusNotices, useScreenStyles } from '../../src/components/Shell';
import {
  AppText,
  Button,
  Icon,
  IconButton,
  InlineNotice,
  StateView,
} from '../../src/components/ui';
import { useLibrary } from '../../src/state/LibraryProvider';
import { fonts, useTheme, useThemedStyles, type ThemeColors } from '../../src/theme';
import type { Movie } from '../../src/types/movie';

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const library = useLibrary();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const screenStyles = useScreenStyles();
  const collection = library.collections.find((item) => item.id === id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Movie | null>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/library'));
  const saveName = () => {
    const result = library.renameCollection(id, name);
    setError(result);
    if (!result) setEditing(false);
  };
  return (
    <SafeAreaView style={screenStyles.screen}>
      <FlatList<Movie>
        data={collection?.movies ?? []}
        keyExtractor={(movie) => movie.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={
          <>
            <View style={styles.topbar}>
              <IconButton name="arrow-back-outline" label="Back to your library" onPress={back} />
              <AppText style={styles.topTitle}>Your collection</AppText>
              <Icon name="albums-outline" color={colors.accent} size={24} />
            </View>
            <StatusNotices />
            {collection && (
              <>
                <View style={styles.titleRow}>
                  <AppText accessibilityRole="header" style={[screenStyles.title, styles.title]}>
                    {collection.name}
                  </AppText>
                  <IconButton
                    name={editing ? 'close-outline' : 'pencil-outline'}
                    label={editing ? 'Cancel renaming collection' : 'Rename collection'}
                    onPress={() => {
                      setEditing(!editing);
                      setName(collection.name);
                      setError(null);
                    }}
                  />
                </View>
                <AppText style={screenStyles.subtitle}>
                  {collection.movies.length} {collection.movies.length === 1 ? 'title' : 'titles'} ·
                  Curated by you, ready offline.
                </AppText>
                <AppText style={styles.note}>
                  Add movies and series using “Add to a collection” on any title.
                </AppText>
                {editing && (
                  <View style={styles.renameForm}>
                    <AppText style={styles.label}>Collection name</AppText>
                    <TextInput
                      autoFocus
                      value={name}
                      onChangeText={(value) => {
                        setName(value);
                        setError(null);
                      }}
                      accessibilityLabel="Rename collection"
                      placeholder="Collection name"
                      placeholderTextColor={colors.subtle}
                      selectionColor={colors.accent}
                      maxLength={40}
                      returnKeyType="done"
                      onSubmitEditing={saveName}
                      style={styles.input}
                    />
                    {error && (
                      <AppText accessibilityRole="alert" style={styles.error}>
                        {error}
                      </AppText>
                    )}
                    <Button icon="checkmark-outline" onPress={saveName} disabled={!name.trim()}>
                      Save name
                    </Button>
                  </View>
                )}
                {removed && (
                  <InlineNotice
                    message={`Removed “${removed.title}”.`}
                    action="Undo"
                    onAction={() => {
                      if (!collection.movies.some((movie) => movie.id === removed.id))
                        library.toggleCollectionMovie(collection.id, removed);
                      setRemoved(null);
                    }}
                  />
                )}
                {collection.movies.length > 0 && (
                  <View style={styles.listHeading}>
                    <AppText style={styles.listNote}>Most recently added first</AppText>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.navigate('/')}
                      style={styles.explore}
                    >
                      <AppText style={styles.exploreText}>Find more</AppText>
                      <Icon name="arrow-forward-outline" color={colors.accent} size={16} />
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </>
        }
        renderItem={({ item: movie }) => (
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${movie.title}`}
              onPress={() => router.push({ pathname: '/movie/[id]', params: { id: movie.id } })}
              style={({ pressed }) => [styles.film, pressed && styles.pressed]}
            >
              <View style={styles.poster}>
                <Icon name="film-outline" color={colors.subtle} size={26} />
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
              <View style={styles.info}>
                <AppText numberOfLines={3} style={styles.filmTitle}>
                  {movie.title}
                </AppText>
                <AppText numberOfLines={2} style={styles.metadata}>
                  {[movie.year, movie.mediaType === 'series' ? 'Series' : 'Movie', movie.genres[0]]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
                {movie.rating !== null && (
                  <View style={styles.rating}>
                    <Icon name="star" color={colors.accent} size={14} />
                    <AppText style={styles.metadata}>{movie.rating.toFixed(1)} / 10</AppText>
                  </View>
                )}
              </View>
            </Pressable>
            <IconButton
              name="close-outline"
              label={`Remove ${movie.title} from ${collection?.name}`}
              onPress={() => {
                if (collection) {
                  library.toggleCollectionMovie(collection.id, movie);
                  setRemoved(movie);
                }
              }}
              style={styles.remove}
            />
          </View>
        )}
        ListEmptyComponent={
          !library.isHydrated ? (
            library.storageError ? (
              <StateView
                icon="alert-circle-outline"
                title="Your collection needs a moment."
                description="Your saved data is unchanged. Retry to open it."
                action="Retry"
                onAction={library.retrySave}
              />
            ) : (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.accent} accessibilityLabel="Opening collection" />
              </View>
            )
          ) : !collection ? (
            <StateView
              icon="albums-outline"
              title="This collection isn’t here."
              description="It may have been removed from this device. Your other collections are in your library."
              action="Open library"
              onAction={() => router.replace('/library')}
            />
          ) : (
            <StateView
              icon="film-outline"
              title="Pick the opening scene."
              description="Find a movie or series you love, open its details, and add it to this collection."
              action="Explore titles"
              onAction={() => router.navigate('/')}
            />
          )
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
      maxWidth: 900,
      width: '100%',
      alignSelf: 'center',
      flexGrow: 1,
    },
    topbar: {
      paddingVertical: 16,
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
      marginBottom: 20,
    },
    topTitle: { flex: 1, fontFamily: fonts.medium, fontSize: 14 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: { flex: 1 },
    note: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 12, marginBottom: 20 },
    renameForm: { gap: 12, marginVertical: 20 },
    label: { fontFamily: fonts.medium, fontSize: 13 },
    input: {
      minHeight: 52,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.text,
    },
    error: { color: colors.error, fontSize: 13 },
    listHeading: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    listNote: { color: colors.muted, fontSize: 12 },
    explore: { flexDirection: 'row', gap: 7, alignItems: 'center', minHeight: 48 },
    exploreText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 13 },
    row: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    film: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
    poster: {
      width: 64,
      height: 96,
      borderRadius: 8,
      backgroundColor: colors.raised,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1, gap: 6 },
    filmTitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
    metadata: { color: colors.muted, fontSize: 12, lineHeight: 18 },
    rating: { flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 2 },
    remove: { backgroundColor: 'transparent' },
    loading: { paddingVertical: 64 },
    pressed: { opacity: 0.65 },
  });
