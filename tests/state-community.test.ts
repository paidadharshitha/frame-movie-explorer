import { describe, expect, it, vi } from 'vitest';
import {
  COMMUNITY_STORAGE_KEY,
  CommunityStore,
  decodeCommunity,
  MAX_COMMENT_LENGTH,
  type LocalComment,
  type LocalProfile,
} from '../src/state/community-store';
import type { FavouriteStorage } from '../src/state/favourites-store';

const profile: LocalProfile = {
  id: 'person-1',
  name: 'Maya',
  email: 'maya@example.com',
  createdAt: 1000,
};
const comment: LocalComment = {
  id: 'comment-1',
  movieId: 'jikan-123',
  authorId: profile.id,
  authorName: profile.name,
  text: 'An unforgettable final scene.',
  spoiler: true,
  createdAt: 2000,
};
const envelope = (
  profiles: LocalProfile[] = [profile],
  comments: LocalComment[] = [comment],
  currentProfileId: string | null = profile.id,
) => JSON.stringify({ version: 1, profiles, comments, currentProfileId });

function storageWith(raw: string | null = null) {
  return {
    getItem: vi.fn(async () => raw),
    setItem: vi.fn(async (_key: string, _value: string) => {}),
  } satisfies FavouriteStorage;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}
function idFactory() {
  let id = 0;
  return () => `generated-${++id}`;
}

describe('local demo profiles and comments', () => {
  it('blocks every mutation until a complete stored session has loaded', async () => {
    const read = deferred<string | null>();
    const storage = storageWith();
    storage.getItem.mockReturnValue(read.promise);
    const store = new CommunityStore(storage);
    const firstRead = store.hydrate();
    expect(store.hydrate()).toBe(firstRead);
    expect(store.signIn('Asha', 'asha@example.com')).toMatch(/loading/);
    expect(store.addComment('jikan-123', 'Thoughts', false)).toMatch(/loading/);
    store.signOut();
    expect(store.deleteComment(comment.id)).toBeNull();
    store.restoreComment(comment);
    expect(storage.setItem).not.toHaveBeenCalled();
    read.resolve(envelope());
    await firstRead;
    expect(store.getSnapshot()).toEqual({
      profile,
      profiles: [profile],
      comments: [comment],
      isHydrated: true,
      storageError: null,
    });
    await store.hydrate();
    expect(storage.getItem).toHaveBeenCalledTimes(1);
    expect(storage.getItem).toHaveBeenCalledWith(COMMUNITY_STORAGE_KEY);
  });

  it('normalizes a demo profile, persists its session, and preserves identity when signing back in', async () => {
    const storage = storageWith();
    const store = new CommunityStore(storage, () => 3000, idFactory());
    await store.hydrate();
    expect(store.signIn('  Maya   Rao  ', ' MAYA@EXAMPLE.COM ')).toBeNull();
    const signedIn = store.getSnapshot().profile!;
    expect(signedIn).toEqual({
      id: 'generated-1',
      name: 'Maya Rao',
      email: 'maya@example.com',
      createdAt: 3000,
    });
    expect(store.addComment('tmdb-55', '  Worth a watch.  ', false)).toBeNull();
    store.signOut();
    expect(store.getSnapshot().profile).toBeNull();
    expect(store.getSnapshot().comments).toHaveLength(1);
    expect(store.addComment('tmdb-55', 'Another note', false)).toMatch(/Sign in/);
    expect(store.signIn('Maya', 'maya@example.com')).toBeNull();
    expect(store.getSnapshot().profile).toEqual({ ...signedIn, name: 'Maya' });
    expect(store.getSnapshot().profiles).toHaveLength(1);
    expect(store.getSnapshot().comments[0]?.authorId).toBe(signedIn.id);
    expect(store.getSnapshot().comments[0]?.authorName).toBe('Maya Rao');
    await store.retrySave();
    const saved = storage.setItem.mock.calls.at(-1)![1];
    expect(decodeCommunity(saved)).toEqual({
      profile: store.getSnapshot().profile,
      profiles: store.getSnapshot().profiles,
      comments: store.getSnapshot().comments,
    });
  });

  it('validates names, emails, movie identities, blank text, and the exact comment length limit', async () => {
    const storage = storageWith();
    const store = new CommunityStore(storage, () => 1000, idFactory());
    await store.hydrate();
    for (const name of ['', 'A', 'a'.repeat(41)]) {
      expect(store.signIn(name, 'valid@example.com')).toMatch(/name/);
    }
    for (const email of [
      '',
      'not-an-email',
      'name@@example.com',
      'name@example',
      'name @example.com',
      `${'a'.repeat(250)}@example.com`,
    ]) {
      expect(store.signIn('Maya', email)).toMatch(/email/);
    }
    expect(storage.setItem).not.toHaveBeenCalled();
    store.signIn('Maya', 'maya@example.com');
    for (const movieId of [
      'jikan-0',
      'tmdb--1',
      'tmdb-9007199254740992',
      'other-1',
      'jikan-1/trailer',
    ]) {
      expect(store.addComment(movieId, 'Good film', false)).toMatch(/film/);
    }
    expect(store.addComment('jikan-1', ' \n ', false)).toMatch(/Write/);
    expect(store.addComment('jikan-1', 'a'.repeat(MAX_COMMENT_LENGTH + 1), false)).toMatch(/1000/);
    expect(store.addComment('jikan-1', 'a'.repeat(MAX_COMMENT_LENGTH), true)).toBeNull();
    expect(store.getSnapshot().comments).toHaveLength(1);
    expect(store.getSnapshot().comments[0]?.spoiler).toBe(true);
  });

  it('keeps authorship local and prevents another active profile from deleting or restoring an entry', async () => {
    const store = new CommunityStore(storageWith(envelope()), () => 3000, idFactory());
    await store.hydrate();
    store.signIn('Asha', 'asha@example.com');
    expect(store.deleteComment(comment.id)).toBeNull();
    store.restoreComment({ ...comment, id: 'another-comment' });
    expect(store.getSnapshot().comments).toEqual([comment]);
    store.signOut();
    expect(store.deleteComment(comment.id)).toBeNull();
    store.restoreComment({ ...comment, id: 'another-comment' });
    expect(store.getSnapshot().comments).toEqual([comment]);
    store.signIn('Maya', 'MAYA@example.com');
    expect(store.deleteComment(comment.id)).toEqual(comment);
    expect(store.getSnapshot().comments).toEqual([]);
  });

  it('Undo restores original text, spoiler status, author, and date without duplicate entries', async () => {
    const store = new CommunityStore(storageWith(envelope()), () => 5000, idFactory());
    await store.hydrate();
    const deleted = store.deleteComment(comment.id)!;
    store.addComment(comment.movieId, 'A later thought.', false);
    store.restoreComment(deleted);
    store.restoreComment(deleted);
    expect(store.getSnapshot().comments).toHaveLength(2);
    expect(store.getSnapshot().comments[1]).toEqual(comment);
    store.restoreComment({ ...comment, id: 'invalid', text: '' });
    expect(store.getSnapshot().comments).toHaveLength(2);
  });

  it('serializes rapid profile and comment changes into a final atomic snapshot', async () => {
    const blockedWrite = deferred<void>();
    const storage = storageWith();
    storage.setItem.mockImplementationOnce(() => blockedWrite.promise);
    const store = new CommunityStore(storage, () => 1000, idFactory());
    await store.hydrate();
    store.signIn('Maya', 'maya@example.com');
    store.addComment('jikan-1', 'Keep this comment.', false);
    store.addComment('jikan-1', 'Remove this comment.', true);
    store.deleteComment(store.getSnapshot().comments[0]!.id);
    store.signOut();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    blockedWrite.resolve();
    await store.retrySave();
    expect(storage.setItem).toHaveBeenCalledTimes(2);
    const finalData = decodeCommunity(storage.setItem.mock.calls.at(-1)![1]);
    expect(finalData.profile).toBeNull();
    expect(finalData.profiles).toHaveLength(1);
    expect(finalData.comments.map((entry) => entry.text)).toEqual(['Keep this comment.']);
  });

  it('preserves comments and signed-out status across a new store instance', async () => {
    let persisted: string | null = null;
    const storage: FavouriteStorage = {
      getItem: async () => persisted,
      setItem: async (_key, value) => {
        persisted = value;
      },
    };
    const store = new CommunityStore(storage, () => 1000, idFactory());
    await store.hydrate();
    store.signIn('Maya', 'maya@example.com');
    store.addComment('tmdb-25', 'A story to remember.', true);
    store.signOut();
    await store.retrySave();
    const restarted = new CommunityStore(storage);
    await restarted.hydrate();
    expect(restarted.getSnapshot().profile).toBeNull();
    expect(restarted.getSnapshot().comments).toEqual(store.getSnapshot().comments);
    restarted.signIn('Maya', 'MAYA@example.com');
    expect(restarted.getSnapshot().profile?.id).toBe(store.getSnapshot().profiles[0]?.id);
  });

  it('retains optimistic changes after storage failure and retries the latest state', async () => {
    const storage = storageWith(envelope());
    storage.setItem.mockRejectedValueOnce(new Error('Disk full'));
    const store = new CommunityStore(storage, () => 3000, idFactory());
    await store.hydrate();
    store.addComment('jikan-123', 'Keep this thought safe.', false);
    await store.retrySave();
    expect(store.getSnapshot().comments).toHaveLength(2);
    expect(store.getSnapshot().storageError).toMatch(/Retry/);
    await store.retrySave();
    expect(store.getSnapshot().storageError).toBeNull();
    expect(decodeCommunity(storage.setItem.mock.calls.at(-1)![1]).comments).toEqual(
      store.getSnapshot().comments,
    );
  });

  it('preserves corrupt storage without writing and allows a successful recovery', async () => {
    const storage = storageWith('{broken');
    const store = new CommunityStore(storage);
    await store.hydrate();
    expect(store.getSnapshot().isHydrated).toBe(false);
    expect(store.getSnapshot().storageError).toMatch(/unchanged/);
    store.signIn('Asha', 'asha@example.com');
    store.signOut();
    store.addComment('jikan-123', 'A thought', false);
    store.deleteComment(comment.id);
    store.restoreComment(comment);
    expect(storage.setItem).not.toHaveBeenCalled();
    storage.getItem.mockResolvedValue(envelope());
    await store.retrySave();
    expect(store.getSnapshot().profile).toEqual(profile);
    expect(store.getSnapshot().comments).toEqual([comment]);
    expect(store.getSnapshot().storageError).toBeNull();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('retries an unavailable initial storage read without changing its data', async () => {
    const storage = storageWith(envelope());
    storage.getItem.mockRejectedValueOnce(new Error('Unavailable'));
    const store = new CommunityStore(storage);
    await store.hydrate();
    expect(store.getSnapshot().isHydrated).toBe(false);
    await store.retrySave();
    expect(store.getSnapshot().isHydrated).toBe(true);
    expect(store.getSnapshot().comments).toEqual([comment]);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('rejects malformed profiles, comment ownership, active sessions, and duplicate identities', () => {
    expect(decodeCommunity(null)).toEqual({ profile: null, profiles: [], comments: [] });
    const invalid = [
      { version: 2, profiles: [], comments: [], currentProfileId: null },
      { version: 1, profiles: [profile, profile], comments: [], currentProfileId: null },
      {
        version: 1,
        profiles: [profile, { ...profile, id: 'person-2' }],
        comments: [],
        currentProfileId: null,
      },
      {
        version: 1,
        profiles: [{ ...profile, email: 'broken' }],
        comments: [],
        currentProfileId: null,
      },
      { version: 1, profiles: [profile], comments: [comment], currentProfileId: 'missing' },
      { version: 1, profiles: [profile], comments: [comment, comment], currentProfileId: null },
      { version: 1, profiles: [], comments: [comment], currentProfileId: null },
      {
        version: 1,
        profiles: [profile],
        comments: [{ ...comment, spoiler: 'yes' }],
        currentProfileId: null,
      },
      {
        version: 1,
        profiles: [profile],
        comments: [{ ...comment, movieId: 'jikan-0' }],
        currentProfileId: null,
      },
      {
        version: 1,
        profiles: [profile],
        comments: [{ ...comment, createdAt: -1 }],
        currentProfileId: null,
      },
      {
        version: 1,
        profiles: [profile],
        comments: [{ ...comment, text: '' }],
        currentProfileId: null,
      },
    ];
    for (const data of invalid) expect(() => decodeCommunity(JSON.stringify(data))).toThrow();
  });
});
