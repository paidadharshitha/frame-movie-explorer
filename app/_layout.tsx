import { useEffect } from 'react';
import {
  Stack,
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
  type ErrorBoundaryProps,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif/400Regular';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { AppProviders } from '../src/state';
import { ThemeProvider, useTheme } from '../src/theme';
import { StateView } from '../src/components/ui';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
      <StateView
        icon="film-outline"
        title="Let’s take it from the top."
        description="Something unexpected happened. Your saved collection is still on this device."
        action="Try again"
        onAction={retry}
      />
    </SafeAreaView>
  );
}

function ThemedApp() {
  const { colors, isDark, reduceMotion } = useTheme();
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    InstrumentSerif_400Regular,
  });
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded, error]);
  if (!loaded && !error)
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} accessibilityLabel="Opening Frame" />
      </View>
    );
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;
  return (
    <AppProviders>
      <NavigationThemeProvider
        value={{
          ...navigationTheme,
          colors: {
            ...navigationTheme.colors,
            primary: colors.accent,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.accent,
          },
        }}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: reduceMotion ? 'none' : 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="movie/[id]" />
          <Stack.Screen name="about" />
          <Stack.Screen name="account" />
          <Stack.Screen name="collection/[id]" />
        </Stack>
      </NavigationThemeProvider>
    </AppProviders>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
