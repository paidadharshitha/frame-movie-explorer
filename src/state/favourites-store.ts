import type { Movie } from '../types/movie';
import { safeUrl } from '../api/normalize';

export const FAVOURITES_STORAGE_KEY = '@frame/favourites/v1';

export interface FavouriteStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface FavouritesSnapshot {
  favourites: Movie[];
  isHydrated: boolean;
  storageError: string | null;
}

export function isMovie(value: unknown): value is Movie {
  if (!value || typeof value !== 'object') return false;
  const movie = value as Record<string, unknown>;
  const id = typeof movie.id === 'string' ? /^(jikan|tmdb)-(tv-)?([1-9]\d*)$/.exec(movie.id) : null;
  return (
    id !== null &&
    id[1] === movie.provider &&
    Number.isSafeInteger(Number(id[3])) &&
    !(id[1] === 'jikan' && id[2]) &&
    (movie.mediaType === undefined ||
      movie.mediaType === 'movie' ||
      movie.mediaType === 'series') &&
    (!id[2] || movie.mediaType === undefined || movie.mediaType === 'series') &&
    (movie.status === undefined || typeof movie.status === 'string') &&
    [movie.episodeCount, movie.seasonCount].every(
      (count) =>
        count === undefined ||
        (typeof count === 'number' && Number.isSafeInteger(count) && count >= 0),
    ) &&
    typeof movie.title === 'string' &&
    movie.title.trim().length > 0 &&
    (movie.posterUrl === null || safeUrl(movie.posterUrl) !== undefined) &&
    (movie.backdropUrl === undefined ||
      movie.backdropUrl === null ||
      safeUrl(movie.backdropUrl) !== undefined) &&
    (movie.sourceUrl === undefined || safeUrl(movie.sourceUrl) !== undefined) &&
    (movie.trailerUrl === undefined || safeUrl(movie.trailerUrl) !== undefined) &&
    (movie.originalTitle === undefined || typeof movie.originalTitle === 'string') &&
    (movie.releaseDate === undefined || typeof movie.releaseDate === 'string') &&
    (movie.runtime === undefined || movie.runtime === null || typeof movie.runtime === 'string') &&
    (movie.ratingCount === undefined ||
      (typeof movie.ratingCount === 'number' &&
        Number.isFinite(movie.ratingCount) &&
        movie.ratingCount >= 0)) &&
    typeof movie.overview === 'string' &&
    (typeof movie.year === 'string' || movie.year === null) &&
    (movie.rating === null ||
      (typeof movie.rating === 'number' && movie.rating >= 0 && movie.rating <= 10)) &&
    Array.isArray(movie.genres) &&
    movie.genres.every((genre) => typeof genre === 'string')
  );
}

export function decodeFavourites(raw: string | null): Movie[] {
  if (raw === null) return [];
  const stored: unknown = JSON.parse(raw);
  if (!stored || typeof stored !== 'object') throw new Error('Invalid favourites data');
  const envelope = stored as Record<string, unknown>;
  if (
    envelope.version !== 1 ||
    !Array.isArray(envelope.movies) ||
    !envelope.movies.every(isMovie)
  ) {
    throw new Error('Unsupported or damaged favourites data');
  }
  // Be tolerant of duplicate records, without silently discarding damaged movies.
  return [...new Map(envelope.movies.map((movie) => [movie.id, movie])).values()];
}

/**
 * Storage operations live outside React so fast taps cannot race one another.
 * Loading must succeed before a write is allowed; an unreadable collection is
 * preserved for recovery rather than replaced with an empty array.
 */
export class FavouritesStore {
  private snapshot: FavouritesSnapshot = {
    favourites: [],
    isHydrated: false,
    storageError: null,
  };
  private listeners = new Set<() => void>();
  private hydration: Promise<void> | null = null;
  private writing: Promise<void> | null = null;
  private revision = 0;
  private savedRevision = 0;

  constructor(private readonly storage: FavouriteStorage) {}

  getSnapshot = (): FavouritesSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private update(next: Partial<FavouritesSnapshot>) {
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
      const raw = await this.storage.getItem(FAVOURITES_STORAGE_KEY);
      const favourites = decodeFavourites(raw);
      this.update({ favourites, isHydrated: true, storageError: null });
    } catch {
      this.update({
        storageError:
          'Couldn’t load your saved movies. Your stored collection is unchanged. Retry to recover it.',
      });
    }
  }

  toggleFavourite = (movie: Movie): void => {
    if (!this.snapshot.isHydrated) return;
    const exists = this.snapshot.favourites.some((saved) => saved.id === movie.id);
    const favourites = exists
      ? this.snapshot.favourites.filter((saved) => saved.id !== movie.id)
      : [movie, ...this.snapshot.favourites];
    this.revision += 1;
    this.update({ favourites });
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
      const payload = JSON.stringify({ version: 1, movies: this.snapshot.favourites });
      try {
        await this.storage.setItem(FAVOURITES_STORAGE_KEY, payload);
        this.savedRevision = savingRevision;
        if (this.snapshot.storageError) this.update({ storageError: null });
      } catch {
        this.update({
          storageError:
            'Your latest changes couldn’t be saved on this device. Keep the app open and tap Retry.',
        });
        return;
      }
    }
  }
}
