import type { Movie } from '../types/movie';
import { isMovie, type FavouriteStorage } from './favourites-store';

export const WATCHLIST_STORAGE_KEY = '@frame/watchlist/v1';
export type WatchlistStatus = 'planned' | 'watched';

export interface WatchlistEntry {
  movie: Movie;
  status: WatchlistStatus;
  addedAt: number;
  watchedAt?: number;
}

export interface WatchlistSnapshot {
  entries: WatchlistEntry[];
  isHydrated: boolean;
  storageError: string | null;
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isEntry(value: unknown): value is WatchlistEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    isMovie(entry.movie) &&
    isTimestamp(entry.addedAt) &&
    (entry.status === 'planned'
      ? entry.watchedAt === undefined
      : entry.status === 'watched' && isTimestamp(entry.watchedAt))
  );
}

export function decodeWatchlist(raw: string | null): WatchlistEntry[] {
  if (raw === null) return [];
  const stored: unknown = JSON.parse(raw);
  if (!stored || typeof stored !== 'object') throw new Error('Invalid watchlist data');
  const envelope = stored as Record<string, unknown>;
  if (
    envelope.version !== 1 ||
    !Array.isArray(envelope.entries) ||
    !envelope.entries.every(isEntry)
  ) {
    throw new Error('Unsupported or damaged watchlist data');
  }
  return [...new Map(envelope.entries.map((entry) => [entry.movie.id, entry])).values()];
}

/** Complete movie snapshots keep a watchlist useful without a connection. */
export class WatchlistStore {
  private snapshot: WatchlistSnapshot = {
    entries: [],
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
  ) {}

  getSnapshot = (): WatchlistSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private update(next: Partial<WatchlistSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.listeners.forEach((listener) => listener());
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
      const raw = await this.storage.getItem(WATCHLIST_STORAGE_KEY);
      const entries = decodeWatchlist(raw);
      this.update({ entries, isHydrated: true, storageError: null });
    } catch {
      this.update({
        storageError:
          'Couldn’t load your watchlist. Your stored list is unchanged. Retry to recover it.',
      });
    }
  }

  setStatus = (movie: Movie, status: WatchlistStatus): void => {
    if (!this.snapshot.isHydrated) return;
    const existing = this.snapshot.entries.find((entry) => entry.movie.id === movie.id);
    if (existing?.status === status) return;
    const now = this.now();
    const entry: WatchlistEntry = {
      movie,
      status,
      addedAt: existing?.addedAt ?? now,
      ...(status === 'watched' ? { watchedAt: now } : {}),
    };
    const entries = existing
      ? this.snapshot.entries.map((saved) => (saved.movie.id === movie.id ? entry : saved))
      : [entry, ...this.snapshot.entries];
    this.revision += 1;
    this.update({ entries });
    void this.save();
  };

  removeMovie = (id: string): void => {
    if (!this.snapshot.isHydrated) return;
    const entries = this.snapshot.entries.filter((entry) => entry.movie.id !== id);
    if (entries.length === this.snapshot.entries.length) return;
    this.revision += 1;
    this.update({ entries });
    void this.save();
  };

  restoreEntry = (entry: WatchlistEntry): void => {
    if (
      !this.snapshot.isHydrated ||
      !isEntry(entry) ||
      this.snapshot.entries.some((saved) => saved.movie.id === entry.movie.id)
    ) {
      return;
    }
    this.revision += 1;
    this.update({ entries: [entry, ...this.snapshot.entries] });
    void this.save();
  };

  retrySave = (): Promise<void> => {
    return this.snapshot.isHydrated ? this.save() : this.hydrate();
  };

  private save(): Promise<void> {
    if (this.writing) return this.writing;
    this.writing = this.flush().finally(() => {
      this.writing = null;
      if (this.savedRevision < this.revision && !this.snapshot.storageError) {
        void this.save();
      }
    });
    return this.writing;
  }

  private async flush(): Promise<void> {
    while (this.savedRevision < this.revision) {
      const savingRevision = this.revision;
      const payload = JSON.stringify({ version: 1, entries: this.snapshot.entries });
      try {
        await this.storage.setItem(WATCHLIST_STORAGE_KEY, payload);
        this.savedRevision = savingRevision;
        if (this.snapshot.storageError) this.update({ storageError: null });
      } catch {
        this.update({
          storageError:
            'Your watchlist changes couldn’t be saved on this device. Keep the app open and tap Retry.',
        });
        return;
      }
    }
  }
}
