import type { FavouriteStorage } from './favourites-store';

export const COMMUNITY_STORAGE_KEY = '@frame/community/v1';
export const MAX_COMMENT_LENGTH = 1000;

export interface LocalProfile {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

export interface LocalComment {
  id: string;
  movieId: string;
  authorId: string;
  authorName: string;
  text: string;
  spoiler: boolean;
  createdAt: number;
}

export interface CommunitySnapshot {
  profile: LocalProfile | null;
  profiles: LocalProfile[];
  comments: LocalComment[];
  isHydrated: boolean;
  storageError: string | null;
}

type CommunityData = Pick<CommunitySnapshot, 'profile' | 'profiles' | 'comments'>;

const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ');
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const validName = (name: unknown): name is string =>
  typeof name === 'string' && name.length >= 2 && name.length <= 40 && normalizeName(name) === name;
const validEmail = (email: unknown): email is string =>
  typeof email === 'string' &&
  email.length <= 254 &&
  normalizeEmail(email) === email &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validId = (id: unknown): id is string =>
  typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id);
const validTimestamp = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

function validMovieId(value: unknown): value is string {
  const match = typeof value === 'string' ? /^(jikan|tmdb)-([1-9]\d*)$/.exec(value) : null;
  return match !== null && Number.isSafeInteger(Number(match[2]));
}

function isProfile(value: unknown): value is LocalProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Record<string, unknown>;
  return (
    validId(profile.id) &&
    validName(profile.name) &&
    validEmail(profile.email) &&
    validTimestamp(profile.createdAt)
  );
}

function isComment(value: unknown): value is LocalComment {
  if (!value || typeof value !== 'object') return false;
  const comment = value as Record<string, unknown>;
  return (
    validId(comment.id) &&
    validMovieId(comment.movieId) &&
    validId(comment.authorId) &&
    validName(comment.authorName) &&
    typeof comment.text === 'string' &&
    comment.text.trim() === comment.text &&
    comment.text.length > 0 &&
    comment.text.length <= MAX_COMMENT_LENGTH &&
    typeof comment.spoiler === 'boolean' &&
    validTimestamp(comment.createdAt)
  );
}

/** A malformed or inconsistent envelope is preserved for recovery, never partially discarded. */
export function decodeCommunity(raw: string | null): CommunityData {
  if (raw === null) return { profile: null, profiles: [], comments: [] };
  const stored: unknown = JSON.parse(raw);
  if (!stored || typeof stored !== 'object') throw new Error('Invalid local profile data');
  const envelope = stored as Record<string, unknown>;
  if (
    envelope.version !== 1 ||
    !Array.isArray(envelope.profiles) ||
    !envelope.profiles.every(isProfile) ||
    !Array.isArray(envelope.comments) ||
    !envelope.comments.every(isComment)
  )
    throw new Error('Unsupported or damaged local profile data');

  const profiles = envelope.profiles;
  const comments = envelope.comments;
  const profileIds = new Set(profiles.map((profile) => profile.id));
  if (
    profileIds.size !== profiles.length ||
    new Set(profiles.map((profile) => profile.email)).size !== profiles.length ||
    new Set(comments.map((comment) => comment.id)).size !== comments.length ||
    comments.some((comment) => !profileIds.has(comment.authorId)) ||
    (envelope.currentProfileId !== null &&
      (!validId(envelope.currentProfileId) || !profileIds.has(envelope.currentProfileId)))
  )
    throw new Error('Inconsistent local profile data');
  return {
    profiles,
    comments,
    profile: profiles.find((profile) => profile.id === envelope.currentProfileId) ?? null,
  };
}

let idSequence = 0;
const createLocalId = () =>
  `local-${Date.now().toString(36)}-${(++idSequence).toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Local demo identity, not authentication. No password, verification, or shared account exists. */
export class CommunityStore {
  private snapshot: CommunitySnapshot = {
    profile: null,
    profiles: [],
    comments: [],
    isHydrated: false,
    storageError: null,
  };
  private listeners = new Set<() => void>();
  private hydration: Promise<void> | null = null;
  private writing: Promise<void> | null = null;
  private revision = 0;
  private savedRevision = 0;

  constructor(
    private readonly storage: FavouriteStorage,
    private readonly now: () => number = Date.now,
    private readonly createId: () => string = createLocalId,
  ) {}

  getSnapshot = (): CommunitySnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private update(next: Partial<CommunitySnapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.listeners.forEach((listener) => listener());
  }

  private commit(next: Partial<CommunityData>) {
    this.revision += 1;
    this.update(next);
    void this.save();
  }

  hydrate = (): Promise<void> => {
    if (this.snapshot.isHydrated) return Promise.resolve();
    if (this.hydration) return this.hydration;
    this.hydration = this.load().finally(() => {
      this.hydration = null;
    });
    return this.hydration;
  };

  private async load(): Promise<void> {
    try {
      const data = decodeCommunity(await this.storage.getItem(COMMUNITY_STORAGE_KEY));
      this.update({ ...data, isHydrated: true, storageError: null });
    } catch {
      this.update({
        storageError:
          'Couldn’t load your local profile and comments. Stored data is unchanged. Retry to recover it.',
      });
    }
  }

  signIn = (name: string, email: string): string | null => {
    if (!this.snapshot.isHydrated) return 'Your local profile is still loading. Please try again.';
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);
    if (!validName(normalizedName)) return 'Enter a name between 2 and 40 characters.';
    if (!validEmail(normalizedEmail)) return 'Enter a valid email address.';
    const existing = this.snapshot.profiles.find((profile) => profile.email === normalizedEmail);
    const profile: LocalProfile = existing
      ? { ...existing, name: normalizedName }
      : {
          id: this.createId(),
          name: normalizedName,
          email: normalizedEmail,
          createdAt: this.now(),
        };
    const profiles = existing
      ? this.snapshot.profiles.map((saved) => (saved.id === profile.id ? profile : saved))
      : [...this.snapshot.profiles, profile];
    this.commit({ profile, profiles });
    return null;
  };

  signOut = (): void => {
    if (!this.snapshot.isHydrated || !this.snapshot.profile) return;
    this.commit({ profile: null });
  };

  addComment = (movieId: string, text: string, spoiler: boolean): string | null => {
    if (!this.snapshot.isHydrated) return 'Your comments are still loading. Please try again.';
    const profile = this.snapshot.profile;
    if (!profile) return 'Sign in to a local profile before adding a comment.';
    if (!validMovieId(movieId)) return 'This film can’t receive a comment.';
    const trimmed = text.trim();
    if (trimmed.length === 0) return 'Write a comment before posting.';
    if (trimmed.length > MAX_COMMENT_LENGTH)
      return `Keep your comment within ${MAX_COMMENT_LENGTH} characters.`;
    const comment: LocalComment = {
      id: this.createId(),
      movieId,
      authorId: profile.id,
      authorName: profile.name,
      text: trimmed,
      spoiler,
      createdAt: this.now(),
    };
    this.commit({ comments: [comment, ...this.snapshot.comments] });
    return null;
  };

  deleteComment = (id: string): LocalComment | null => {
    if (!this.snapshot.isHydrated || !this.snapshot.profile) return null;
    const comment = this.snapshot.comments.find((item) => item.id === id);
    if (!comment || comment.authorId !== this.snapshot.profile.id) return null;
    this.commit({ comments: this.snapshot.comments.filter((item) => item.id !== id) });
    return comment;
  };

  restoreComment = (comment: LocalComment): void => {
    if (
      !this.snapshot.isHydrated ||
      !isComment(comment) ||
      comment.authorId !== this.snapshot.profile?.id ||
      this.snapshot.comments.some((item) => item.id === comment.id)
    )
      return;
    this.commit({
      comments: [comment, ...this.snapshot.comments].sort((a, b) => b.createdAt - a.createdAt),
    });
  };

  retrySave = (): Promise<void> => (this.snapshot.isHydrated ? this.save() : this.hydrate());

  private save(): Promise<void> {
    if (this.writing) return this.writing;
    this.writing = this.flush().finally(() => {
      this.writing = null;
      if (this.savedRevision < this.revision && !this.snapshot.storageError) void this.save();
    });
    return this.writing;
  }

  private async flush(): Promise<void> {
    while (this.savedRevision < this.revision) {
      const savingRevision = this.revision;
      const payload = JSON.stringify({
        version: 1,
        profiles: this.snapshot.profiles,
        currentProfileId: this.snapshot.profile?.id ?? null,
        comments: this.snapshot.comments,
      });
      try {
        await this.storage.setItem(COMMUNITY_STORAGE_KEY, payload);
        this.savedRevision = savingRevision;
        if (this.snapshot.storageError) this.update({ storageError: null });
      } catch {
        this.update({
          storageError:
            'Your local profile or comment changes couldn’t be saved. Keep the app open and tap Retry.',
        });
        return;
      }
    }
  }
}
