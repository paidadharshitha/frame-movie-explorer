import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { catalog } from '../src/api/movies';
import { colors, fonts } from '../src/theme';
import { AppText, Button, Icon, IconButton } from '../src/components/ui';
import { Brand } from '../src/components/Shell';

export default function AboutScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.nav}>
          <IconButton
            name="arrow-back"
            label="Go back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
          <Brand compact />
        </View>
        <AppText accessibilityRole="header" style={styles.title}>
          For the love{`\n`}of the story.
        </AppText>
        <AppText style={styles.intro}>
          Frame is a little space for big-screen stories. Find something extraordinary, keep your
          favourites, and come back whenever the mood strikes.
        </AppText>
        <View style={styles.divider} />
        <AppText style={styles.heading}>Your collection, your device.</AppText>
        <AppText style={styles.body}>
          Favourites, watchlists, demo profiles, and comments stay on this device. Previously loaded
          film information is cached for up to 24 hours, so you can keep exploring when your
          connection takes an intermission. Images are cached separately and may need a connection
          the first time.
        </AppText>
        <View style={styles.info}>
          <Icon name="cloud-done-outline" color={colors.accent} />
          <AppText style={styles.infoText}>
            Browse freely. Use a local demo profile to add comments.
          </AppText>
        </View>
        <AppText style={styles.heading}>A credit where it’s due.</AppText>
        <AppText style={styles.body}>{catalog.attribution}</AppText>
        {catalog.id === 'jikan' ? (
          <AppText style={styles.body}>
            The key-free collection focuses on animated films. Ratings reflect MyAnimeList community
            scores. Tenrai is an independent public API and availability may vary. Film artwork
            belongs to its respective owners.
          </AppText>
        ) : (
          <Image
            source={require('../assets/tmdb-logo.png')}
            style={{ width: 140, height: 30, marginTop: 18 }}
            contentFit="contain"
          />
        )}
        <View style={{ alignItems: 'flex-start', marginTop: 20 }}>
          <Button
            secondary
            icon="open-outline"
            onPress={() => {
              void Linking.openURL(
                catalog.id === 'tmdb'
                  ? 'https://www.themoviedb.org'
                  : 'https://api.tenrai.org/documentation',
              ).catch(() => undefined);
            }}
          >
            Explore the data source
          </Button>
        </View>
        <AppText style={styles.version}>
          Frame 1.0.0 · Made for the films that stay with you.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: { padding: 24, maxWidth: 720, width: '100%', alignSelf: 'center', paddingBottom: 48 },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 48,
  },
  title: { fontFamily: fonts.display, fontSize: 52, lineHeight: 56 },
  intro: { color: colors.muted, marginTop: 20, fontSize: 16, lineHeight: 27 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 32 },
  heading: { fontFamily: fonts.semibold, fontSize: 21, lineHeight: 28, marginBottom: 12 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 24, marginBottom: 12 },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 36,
    padding: 18,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  infoText: { color: colors.text, fontSize: 13, flex: 1 },
  version: { color: colors.muted, fontSize: 11, marginTop: 48 },
});
