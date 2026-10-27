import { useRef, useState, type ComponentRef } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '../src/components/Shell';
import { AppText, Button, Icon, IconButton, InlineNotice, StateView } from '../src/components/ui';
import { useCommunity } from '../src/state/CommunityProvider';
import { colors, fonts } from '../src/theme';

export default function AccountScreen() {
  const { profile, comments, isHydrated, storageError, signIn, signOut, retrySave } =
    useCommunity();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [focused, setFocused] = useState<'name' | 'email' | null>(null);
  const emailInput = useRef<ComponentRef<typeof TextInput>>(null);
  const submitted = useRef(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const submit = () => {
    if (submitted.current) return;
    const error = signIn(name, email);
    setFormError(error);
    if (!error) {
      submitted.current = true;
      Keyboard.dismiss();
      back();
    }
  };
  const count = comments.filter((comment) => comment.authorId === profile?.id).length;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.nav}>
            <IconButton name="arrow-back" label="Go back" onPress={back} />
            <Brand compact />
          </View>
          {storageError && (
            <InlineNotice message={storageError} action="Retry" onAction={retrySave} warning />
          )}
          {!isHydrated ? (
            storageError ? (
              <StateView
                icon="person-circle-outline"
                title="Your profile needs a moment."
                description="Use Retry above to reopen your saved profile and comments safely."
              />
            ) : (
              <ActivityIndicator
                color={colors.accent}
                accessibilityLabel="Opening your profile"
                style={{ marginTop: 64 }}
              />
            )
          ) : profile ? (
            <>
              <View style={styles.avatar}>
                <AppText style={styles.initial}>
                  {profile.name.slice(0, 1).toLocaleUpperCase()}
                </AppText>
              </View>
              <AppText accessibilityRole="header" style={styles.title}>
                Hello, {profile.name}.
              </AppText>
              <AppText style={styles.subtitle}>Good films start conversations.</AppText>
              <View style={styles.profileDetails}>
                <AppText style={styles.label}>Demo profile</AppText>
                <AppText selectable style={styles.email}>
                  {profile.email}
                </AppText>
                <View style={styles.commentCount}>
                  <Icon name="chatbubble-ellipses-outline" size={19} color={colors.accent} />
                  <AppText style={styles.count}>
                    {count} {count === 1 ? 'comment' : 'comments'} on this device
                  </AppText>
                </View>
              </View>
              <Button onPress={back} icon="arrow-forward">
                Back to the films
              </Button>
              <Button
                secondary
                icon="log-out-outline"
                style={styles.signOut}
                onPress={() => {
                  signOut();
                  setName('');
                  setEmail('');
                  setFormError(null);
                }}
              >
                Sign out
              </Button>
              <AppText style={styles.note}>
                Signing out keeps your comments here. Use the same email to return to this demo
                profile. Favourites and watchlists belong to the device and are shared between local
                profiles.
              </AppText>
            </>
          ) : (
            <>
              <AppText accessibilityRole="header" style={styles.title}>
                Welcome to{`\n`}your next story.
              </AppText>
              <AppText style={styles.subtitle}>Sign in to leave your take on a film.</AppText>
              <View style={styles.demoNote}>
                <Icon name="phone-portrait-outline" color={colors.accent} size={19} />
                <AppText style={styles.demoText}>Device-only demo. No password needed.</AppText>
              </View>
              <View style={styles.field}>
                <AppText style={styles.label}>Your name</AppText>
                <TextInput
                  accessibilityLabel="Your name"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  placeholder="What should we call you?"
                  placeholderTextColor={colors.subtle}
                  selectionColor={colors.accent}
                  maxLength={40}
                  autoComplete="name"
                  autoCapitalize="words"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => emailInput.current?.focus()}
                  style={[styles.input, focused === 'name' && styles.focused]}
                />
              </View>
              <View style={styles.field}>
                <AppText style={styles.label}>Email</AppText>
                <TextInput
                  ref={emailInput}
                  accessibilityLabel="Email"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.subtle}
                  selectionColor={colors.accent}
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={254}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                  style={[styles.input, focused === 'email' && styles.focused]}
                />
              </View>
              {formError && (
                <AppText
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={styles.error}
                >
                  {formError}
                </AppText>
              )}
              <Button icon="arrow-forward" onPress={submit} style={styles.submit}>
                Sign in
              </Button>
              <AppText style={styles.note}>
                Your email identifies a profile on this device only. It isn’t verified or sent
                anywhere. Comments stay here and aren’t shared with other users.
              </AppText>
              <Button secondary onPress={back}>
                Continue browsing
              </Button>
            </>
          )}
          <View style={styles.about}>
            <Button
              secondary
              icon="information-circle-outline"
              onPress={() => router.push('/about')}
            >
              About Frame
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 24,
    paddingBottom: 40,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: { fontFamily: fonts.display, fontSize: 44, lineHeight: 49, marginBottom: 12 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 24 },
  demoNote: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 26, marginBottom: 28 },
  demoText: { color: colors.muted, fontSize: 12, lineHeight: 18, flex: 1 },
  field: { gap: 8, marginBottom: 20 },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    outlineWidth: 0,
  },
  focused: { borderColor: colors.accent },
  error: { color: colors.error, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  submit: { marginTop: 4 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 20, marginVertical: 20 },
  about: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 24,
    marginTop: 32,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  initial: { fontFamily: fonts.display, fontSize: 44, lineHeight: 50, color: colors.onAccent },
  profileDetails: {
    marginVertical: 28,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  email: { fontSize: 16 },
  commentCount: { flexDirection: 'row', gap: 9, alignItems: 'center', marginTop: 10 },
  count: { color: colors.muted, fontSize: 13, flex: 1 },
  signOut: { marginTop: 12 },
});
