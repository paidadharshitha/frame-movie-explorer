import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useCommunity } from '../state/CommunityProvider';
import { MAX_COMMENT_LENGTH, type LocalComment, type LocalProfile } from '../state/community-store';
import { colors, fonts } from '../theme';
import { AppText, Button, Icon, IconButton, InlineNotice } from './ui';

const PAGE_SIZE = 10;
const COMMENT_LIMIT = MAX_COMMENT_LENGTH;

function CommentComposer({ movieId, profile }: { movieId: string; profile: LocalProfile }) {
  const { addComment, isHydrated } = useCommunity();
  const [text, setText] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);
  const submitted = useRef(false);

  const post = () => {
    // A second tap can arrive before React has cleared the composer.
    if (submitted.current) return;
    submitted.current = true;
    const issue = addComment(movieId, text, spoiler);
    if (issue) {
      submitted.current = false;
      setError(issue);
      return;
    }
    setText('');
    setSpoiler(false);
    setError(null);
    setPosted(true);
  };

  return (
    <View style={styles.composer}>
      <AppText style={styles.composerLabel}>Commenting as {profile.name}</AppText>
      <TextInput
        accessibilityLabel="Write a comment"
        placeholder="What stayed with you after the credits?"
        placeholderTextColor={colors.muted}
        value={text}
        multiline
        maxLength={COMMENT_LIMIT}
        editable={isHydrated}
        textAlignVertical="top"
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChangeText={(value) => {
          submitted.current = false;
          setText(value);
          setError(null);
          setPosted(false);
        }}
        style={[styles.input, focused && styles.inputFocused]}
      />
      <View style={styles.composerOptions}>
        <View style={styles.spoilerOption}>
          <Switch
            accessibilityLabel="This comment contains spoilers"
            value={spoiler}
            onValueChange={setSpoiler}
            disabled={!isHydrated}
            hitSlop={{ top: 9, bottom: 9, left: 8, right: 8 }}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={spoiler ? colors.onAccent : colors.text}
            ios_backgroundColor={colors.border}
          />
          <AppText style={styles.spoilerLabel}>Contains spoilers</AppText>
        </View>
        <AppText style={styles.characterCount}>
          {text.length}/{COMMENT_LIMIT}
        </AppText>
      </View>
      {error && <InlineNotice message={error} warning />}
      <View style={styles.postRow}>
        <AppText accessibilityLiveRegion="polite" style={styles.localHint}>
          {posted ? 'Comment added on this device.' : 'Only visible on this device.'}
        </AppText>
        <Button icon="send-outline" onPress={post} disabled={!isHydrated || !text.trim()}>
          Post comment
        </Button>
      </View>
    </View>
  );
}

function CommentThread({ movieId }: { movieId: string }) {
  const { profile, comments, isHydrated, storageError, deleteComment, restoreComment, retrySave } =
    useCommunity();
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [removed, setRemoved] = useState<LocalComment | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thread = useMemo(
    () =>
      comments
        .filter((comment) => comment.movieId === movieId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [comments, movieId],
  );

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  const remove = (comment: LocalComment) => {
    const deleted = deleteComment(comment.id);
    if (!deleted) return;
    setRemoved(deleted);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), 8000);
  };

  const toggleSpoiler = (id: string) => {
    setRevealed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <AppText accessibilityRole="header" style={styles.heading}>
          Your take on the story.
        </AppText>
        {isHydrated && (
          <AppText
            accessibilityLabel={`${thread.length} ${thread.length === 1 ? 'comment' : 'comments'}`}
            style={styles.count}
          >
            {thread.length}
          </AppText>
        )}
      </View>
      <AppText style={styles.scope}>Comments on this device · Demo</AppText>
      {storageError && (
        <InlineNotice message={storageError} action="Retry" onAction={retrySave} warning />
      )}
      {!isHydrated ? (
        <View style={styles.pending}>
          {storageError ? (
            <AppText style={styles.muted}>
              Your saved comments are unchanged. Retry to open them.
            </AppText>
          ) : (
            <>
              <ActivityIndicator
                color={colors.accent}
                accessibilityLabel="Opening local comments"
              />
              <AppText style={styles.muted}>Opening your comments…</AppText>
            </>
          )}
        </View>
      ) : (
        <>
          {profile ? (
            <CommentComposer key={profile.id} movieId={movieId} profile={profile} />
          ) : (
            <View style={styles.signIn}>
              <AppText style={styles.signInText}>
                Have a thought about this film? Add your name and leave a comment.
              </AppText>
              <Button icon="person-outline" secondary onPress={() => router.push('/account')}>
                Sign in to comment
              </Button>
            </View>
          )}
          {removed && removed.authorId === profile?.id && (
            <View style={styles.undo} accessibilityLiveRegion="polite">
              <AppText style={styles.undoText}>Comment removed.</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Undo comment removal"
                onPress={() => {
                  restoreComment(removed);
                  setRemoved(null);
                  if (undoTimer.current) clearTimeout(undoTimer.current);
                }}
                style={styles.quietButton}
              >
                <AppText style={styles.actionText}>Undo</AppText>
              </Pressable>
            </View>
          )}
          {thread.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="chatbubble-ellipses-outline" color={colors.muted} size={24} />
              <AppText style={styles.emptyTitle}>The conversation starts with you.</AppText>
              <AppText style={styles.emptyText}>
                No comments for this film on this device yet.
              </AppText>
            </View>
          ) : (
            <>
              <AppText style={styles.orderNote}>Newest thoughts first</AppText>
              {thread.slice(0, limit).map((comment) => {
                const visible = !comment.spoiler || revealed.has(comment.id);
                const own = profile?.id === comment.authorId;
                return (
                  <View key={comment.id} style={styles.comment}>
                    <View style={styles.authorRow}>
                      <View style={styles.avatar}>
                        <AppText style={styles.initial}>
                          {Array.from(comment.authorName.trim())[0]?.toUpperCase() || 'F'}
                        </AppText>
                      </View>
                      <View style={styles.authorInfo}>
                        <AppText style={styles.authorName}>
                          {comment.authorName}
                          {own ? ' · You' : ''}
                        </AppText>
                        <AppText style={styles.date}>
                          {new Date(comment.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </AppText>
                      </View>
                      {own && (
                        <IconButton
                          name="trash-outline"
                          label={`Delete your comment from ${new Date(comment.createdAt).toLocaleString()}`}
                          onPress={() => remove(comment)}
                          style={styles.deleteButton}
                        />
                      )}
                    </View>
                    {visible && (
                      <AppText selectable style={styles.commentText}>
                        {comment.text}
                      </AppText>
                    )}
                    {comment.spoiler && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          visible ? 'Hide spoiler comment' : 'Reveal spoiler comment'
                        }
                        accessibilityState={{ expanded: visible }}
                        onPress={() => toggleSpoiler(comment.id)}
                        style={styles.spoilerButton}
                      >
                        <Icon
                          name={visible ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={colors.accent}
                        />
                        <AppText style={styles.actionText}>
                          {visible ? 'Hide spoiler' : 'Spoiler hidden · Tap to reveal'}
                        </AppText>
                      </Pressable>
                    )}
                  </View>
                );
              })}
              {thread.length > limit && (
                <Button
                  secondary
                  icon="add"
                  onPress={() => setLimit((value) => value + PAGE_SIZE)}
                  style={styles.moreButton}
                >
                  Show more comments
                </Button>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

/** Each film owns its composer, spoiler visibility, and short-lived Undo state. */
export function MovieComments({ movieId }: { movieId: string }) {
  return <CommentThread key={movieId} movieId={movieId} />;
}

const styles = StyleSheet.create({
  section: { marginTop: 36, paddingTop: 28, borderTopWidth: 1, borderTopColor: colors.border },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heading: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, flex: 1 },
  count: { color: colors.muted, fontFamily: fonts.medium, fontSize: 17 },
  scope: { color: colors.muted, fontSize: 12, marginTop: 8, marginBottom: 24 },
  composer: { marginBottom: 24 },
  composerLabel: { color: colors.text, fontSize: 13, fontFamily: fonts.medium, marginBottom: 12 },
  input: {
    minHeight: 128,
    maxHeight: 260,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 23,
    outlineWidth: 0,
  },
  inputFocused: { borderColor: colors.accent },
  composerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  spoilerOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 },
  spoilerLabel: { fontSize: 12, color: colors.muted },
  characterCount: { color: colors.muted, fontSize: 11 },
  postRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  localHint: { flex: 1, minWidth: 130, color: colors.muted, fontSize: 11, lineHeight: 17 },
  pending: { paddingVertical: 28, alignItems: 'center', gap: 14 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  signIn: { alignItems: 'flex-start', gap: 16, marginBottom: 24 },
  signInText: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  empty: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  emptyTitle: { fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: 'center' },
  orderNote: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: 4 },
  comment: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 16 },
  authorInfo: { flex: 1 },
  authorName: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 20 },
  date: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 2 },
  deleteButton: { backgroundColor: 'transparent' },
  commentText: { marginTop: 14, color: colors.text, fontSize: 14, lineHeight: 24 },
  spoilerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: 8,
    marginTop: 8,
  },
  actionText: {
    color: colors.accent,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    flexShrink: 1,
  },
  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 14,
    paddingRight: 6,
    backgroundColor: colors.raised,
    borderRadius: 12,
    marginBottom: 12,
  },
  undoText: { fontSize: 13, flex: 1, paddingVertical: 10 },
  quietButton: { minHeight: 48, minWidth: 64, alignItems: 'center', justifyContent: 'center' },
  moreButton: { alignSelf: 'center', marginTop: 20 },
});
