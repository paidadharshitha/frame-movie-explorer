import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { catalog } from '../api/movies';
import { useBrowse } from '../state/BrowseProvider';
import { fonts, useThemedStyles, type ThemeColors } from '../theme';
import type { CatalogLanguage } from '../types/movie';
import { AppText } from './ui';

const languages: { value: CatalogLanguage; label: string }[] = [
  { value: 'all', label: 'All languages' },
  { value: 'te', label: 'Telugu' },
  { value: 'hi', label: 'Hindi' },
  { value: 'en', label: 'English' },
];

export function CatalogSelector() {
  const { mediaType, language, setMediaType, setLanguage } = useBrowse();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.root}>
      <View style={styles.types}>
        {(['movie', 'series'] as const).map((type) => (
          <Pressable
            key={type}
            accessibilityRole="tab"
            accessibilityState={{ selected: mediaType === type }}
            onPress={() => setMediaType(type)}
            style={[styles.type, mediaType === type && styles.selected]}
          >
            <AppText style={[styles.label, mediaType === type && styles.selectedText]}>
              {type === 'movie' ? 'Movies' : 'Series'}
            </AppText>
          </Pressable>
        ))}
      </View>
      {catalog.id === 'tmdb' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.languages}
        >
          {languages.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityLabel={`Original language: ${item.label}`}
              accessibilityState={{ selected: language === item.value }}
              onPress={() => setLanguage(item.value)}
              style={[styles.language, language === item.value && styles.activeLanguage]}
            >
              <AppText
                style={[styles.languageText, language === item.value && styles.activeLanguageText]}
              >
                {item.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <AppText style={styles.hint}>
          Animated movies & series · World cinema opens when TMDB is connected.
        </AppText>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { gap: 10, marginBottom: 24 },
    types: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderRadius: 28,
      padding: 4,
    },
    type: {
      minHeight: 48,
      minWidth: 108,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      borderRadius: 24,
    },
    selected: { backgroundColor: colors.accent },
    label: { fontFamily: fonts.bold, color: colors.muted, fontSize: 16 },
    selectedText: { color: colors.onAccent },
    languages: { gap: 8 },
    language: {
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeLanguage: { borderColor: colors.text, backgroundColor: colors.raised },
    languageText: { fontSize: 13, color: colors.muted, fontFamily: fonts.medium },
    activeLanguageText: { color: colors.text },
    hint: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  });
