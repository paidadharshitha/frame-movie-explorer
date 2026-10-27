import type { Movie } from '../types/movie';
import { isMovie, type FavouriteStorage } from './favourites-store';

export const LIBRARY_STORAGE_KEY = '@frame/library/v1';
export const MAX_COLLECTIONS = 50;

export interface PersonalRating {
  movie: Movie;
  value: number;
  ratedAt: number;
}

export interface MovieCollection {
  id: string;
  name: string;
  createdAt: number;
  movies: Movie[];
}

export interface LibraryData {
  ratings: PersonalRating[];
  collections: MovieCollection[];
}

export interface LibrarySnapshot extends LibraryData {
  isHydrated: boolean;
  storageError: string | null;
}

export function normalizeCollectionName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isRating(value: unknown): value is PersonalRating {
  if (!value || typeof value !== 'object') return false;
  const rating = value as Record<string, unknown>;
  return (
    isMovie(rating.movie) &&
    typeof rating.value === 'number' &&
    Number.isInteger(rating.value) &&
    rating.value >= 1 &&
    rating.value <= 5 &&
    isTimestamp(rating.ratedAt)
  );
}

function isCollection(value: unknown): value is MovieCollection {
  if (!value || typeof value !== 'object') return false;
  const collection = value as Record<string, unknown>;
  return (
    typeof collection.id === 'string' &&
    /^collection-[a-z0-9-]{1,100}$/.test(collection.id) &&
    typeof collection.name === 'string' &&
    normalizeCollectionName(collection.name) === collection.name &&
    collection.name.length >= 1 &&
    collection.name.length <= 40 &&
    isTimestamp(collection.createdAt) &&
    Array.isArray(collection.movies) &&
    collection.movies.every(isMovie)
  );
}

/** Reject a damaged envelope as a whole so a partial read cannot erase saved work. */
export function decodeLibrary(raw: string | null): LibraryData {
  if (raw === null) return { ratings: [], collections: [] };
  const stored: unknown = JSON.parse(raw);
  if (!stored || typeof stored !== 'object') throw new Error('Invalid library');
  const data = stored as Record<string, unknown>;
  if (
    data.version !== 1 ||
    !Array.isArray(data.ratings) ||
    !data.ratings.every(isRating) ||
    !Array.isArray(data.collections) ||
    !data.collections.every(isCollection) ||
    data.collections.length > MAX_COLLECTIONS
  ) {
    throw new Error('Unsupported or damaged library');
  }
  const collections = data.collections;
  if (
    new Set(collections.map(({ id }) => id)).size !== collections.length ||
    new Set(collections.map(({ name }) => name.toLowerCase())).size !== collections.length
  ) {
    throw new Error('Conflicting collections');
  }
  return {
    ratings: [...new Map(data.ratings.map((rating) => [rating.movie.id, rating])).values()],
    collections: collections.map((collection) => ({
      ...collection,
      movies: [...new Map(collection.movies.map((movie) => [movie.id, movie])).values()],
    })),
  };
}

export class LibraryStore {
  private snapshot: LibrarySnapshot = {
    ratings: [],
    collections: [],
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
    private readonly makeId: () => string = () =>
      `collection-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  ) {}

  getSnapshot = (): LibrarySnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private update(next: Partial<LibrarySnapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.listeners.forEach((listener) => listener());
  }

  private change(next: Partial<LibraryData>) {
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

  private async load() {
    try {
      const data = decodeLibrary(await this.storage.getItem(LIBRARY_STORAGE_KEY));
      this.update({ ...data, isHydrated: true, storageError: null });
    } catch {
      this.update({
        storageError:
          'Couldn’t open your ratings and collections. Your saved library is unchanged. Tap Retry to recover it.',
      });
    }
  }

  setRating = (movie: Movie, value: number | null): void => {
    if (
      !this.snapshot.isHydrated ||
      !isMovie(movie) ||
      (value !== null && (!Number.isInteger(value) || value < 1 || value > 5))
    )
      return;
    const existing = this.snapshot.ratings.find((rating) => rating.movie.id === movie.id);
    if ((value === null && !existing) || existing?.value === value) return;
    const remaining = this.snapshot.ratings.filter((rating) => rating.movie.id !== movie.id);
    this.change({
      ratings: value === null ? remaining : [{ movie, value, ratedAt: this.now() }, ...remaining],
    });
  };

  private nameError(name: string, exceptId?: string): string | null {
    if (!name) return 'Give your collection a name.';
    if (name.length > 40) return 'Use 40 characters or fewer.';
    if (
      this.snapshot.collections.some(
        (collection) =>
          collection.id !== exceptId && collection.name.toLowerCase() === name.toLowerCase(),
      )
    )
      return 'You already have a collection with this name.';
    return null;
  }

  createCollection = (input: string): { id?: string; error?: string } => {
    if (!this.snapshot.isHydrated) return { error: 'Your library is still opening. Please retry.' };
    const name = normalizeCollectionName(input);
    const error = this.nameError(name);
    if (error) return { error };
    if (this.snapshot.collections.length >= MAX_COLLECTIONS) {
      return { error: 'You can keep up to 50 collections. Remove one to make room.' };
    }
    const collection: MovieCollection = {
      id: this.makeId(),
      name,
      createdAt: this.now(),
      movies: [],
    };
    if (
      !isCollection(collection) ||
      this.snapshot.collections.some(({ id }) => id === collection.id)
    ) {
      return { error: 'Couldn’t create this collection. Please try again.' };
    }
    this.change({ collections: [collection, ...this.snapshot.collections] });
    return { id: collection.id };
  };

  renameCollection = (id: string, input: string): string | null => {
    if (!this.snapshot.isHydrated) return 'Your library is still opening. Please retry.';
    const collection = this.snapshot.collections.find((item) => item.id === id);
    if (!collection) return 'This collection is no longer available.';
    const name = normalizeCollectionName(input);
    const error = this.nameError(name, id);
    if (error) return error;
    if (name !== collection.name) {
      this.change({
        collections: this.snapshot.collections.map((item) =>
          item.id === id ? { ...item, name } : item,
        ),
      });
    }
    return null;
  };

  deleteCollection = (id: string): MovieCollection | null => {
    if (!this.snapshot.isHydrated) return null;
    const collection = this.snapshot.collections.find((item) => item.id === id);
    if (!collection) return null;
    this.change({ collections: this.snapshot.collections.filter((item) => item.id !== id) });
    return collection;
  };

  restoreCollection = (collection: MovieCollection): string | null => {
    if (!this.snapshot.isHydrated || !isCollection(collection))
      return 'Couldn’t restore this collection.';
    if (this.snapshot.collections.some(({ id }) => id === collection.id)) return null;
    const error = this.nameError(collection.name);
    if (error) return error;
    if (this.snapshot.collections.length >= MAX_COLLECTIONS)
      return 'Remove a collection to make room before restoring.';
    this.change({ collections: [collection, ...this.snapshot.collections] });
    return null;
  };

  toggleCollectionMovie = (collectionId: string, movie: Movie): void => {
    if (!this.snapshot.isHydrated || !isMovie(movie)) return;
    const collection = this.snapshot.collections.find(({ id }) => id === collectionId);
    if (!collection) return;
    const included = collection.movies.some(({ id }) => id === movie.id);
    this.change({
      collections: this.snapshot.collections.map((item) =>
        item.id === collectionId
          ? {
              ...item,
              movies: included
                ? item.movies.filter(({ id }) => id !== movie.id)
                : [movie, ...item.movies],
            }
          : item,
      ),
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
        ratings: this.snapshot.ratings,
        collections: this.snapshot.collections,
      });
      try {
        await this.storage.setItem(LIBRARY_STORAGE_KEY, payload);
        this.savedRevision = savingRevision;
        if (this.snapshot.storageError) this.update({ storageError: null });
      } catch {
        this.update({
          storageError:
            'Your library changes couldn’t be saved on this device. Keep the app open and tap Retry.',
        });
        return;
      }
    }
  }
}
