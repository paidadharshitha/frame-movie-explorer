import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StateView } from '../src/components/ui';
import { useTheme } from '../src/theme';
export default function NotFound() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
      <StateView
        icon="film-outline"
        title="That scene isn’t in this film."
        description="This page doesn’t exist. Let’s find you a story that does."
        action="Back to Discover"
        onAction={() => router.replace('/')}
      />
    </SafeAreaView>
  );
}
