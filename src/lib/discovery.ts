import type { Movie } from '../types/movie';

export interface MovieFilters {
  genre: string | null;
  minimumRating: number | null;
}

const genreKey = (genre: string) => genre.trim().toLocaleLowerCase('en');

function uniqueMovies(movies: readonly Movie[]): Movie[] {
  return [...new Map(movies.map((movie) => [movie.id, movie])).values()];
}

/** Genre labels come from the loaded films, without duplicate case or whitespace variants. */
export function availableGenres(movies: readonly Movie[]): string[] {
  const genres = new Map<string, string>();
  for (const movie of movies) {
    for (const genre of movie.genres) {
      const key = genreKey(genre);
      if (key && !genres.has(key)) genres.set(key, genre.trim());
    }
  }
  return [...genres.values()].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

/** Filters only the supplied catalog; callers should label the scope as loaded films. */
export function filterMovies(movies: readonly Movie[], filters: MovieFilters): Movie[] {
  const genre = filters.genre ? genreKey(filters.genre) : null;
  return movies.filter((movie) => {
    const matchesGenre = !genre || movie.genres.some((value) => genreKey(value) === genre);
    const matchesRating =
      filters.minimumRating === null ||
      (movie.rating !== null &&
        Number.isFinite(movie.rating) &&
        movie.rating >= filters.minimumRating);
    return matchesGenre && matchesRating;
  });
}

interface SurpriseOptions {
  movies: readonly Movie[];
  favourites: readonly Movie[];
  watchedIds: ReadonlySet<string> | readonly string[];
  previousId?: string;
  random?: () => number;
}

export interface SurprisePick {
  movie: Movie;
  reason: string;
}

/** A local, explainable weighted pick. No profile or viewing history leaves the device. */
export function chooseSurprise({
  movies,
  favourites,
  watchedIds,
  previousId,
  random = Math.random,
}: SurpriseOptions): SurprisePick | null {
  const watched = new Set(watchedIds);
  const saved = uniqueMovies(favourites);
  const favouriteIds = new Set(saved.map((movie) => movie.id));
  const unwatched = uniqueMovies(movies).filter((movie) => !watched.has(movie.id));
  const discoveries = unwatched.filter((movie) => !favouriteIds.has(movie.id));
  let candidates = discoveries.length > 0 ? discoveries : unwatched;
  if (candidates.length === 0) return null;
  if (candidates.length > 1) candidates = candidates.filter((movie) => movie.id !== previousId);

  const preferences = new Map<string, number>();
  for (const movie of saved) {
    for (const genre of new Set(movie.genres.map(genreKey).filter(Boolean))) {
      preferences.set(genre, (preferences.get(genre) ?? 0) + 1);
    }
  }

  const weighted = candidates.map((movie) => {
    const genres = [...new Set(movie.genres.map(genreKey).filter(Boolean))];
    const affinity = genres.reduce((sum, genre) => sum + (preferences.get(genre) ?? 0), 0);
    const rating = Number.isFinite(movie.rating) ? Math.max(0, Math.min(10, movie.rating!)) : 0;
    return { movie, weight: 1 + (affinity / Math.max(1, saved.length)) * 3 + rating / 20 };
  });
  const totalWeight = weighted.reduce((total, candidate) => total + candidate.weight, 0);
  const sample = random();
  let remaining = (Number.isFinite(sample) ? Math.max(0, Math.min(1, sample)) : 0.5) * totalWeight;
  let chosen = weighted[weighted.length - 1]!.movie;
  for (const candidate of weighted) {
    remaining -= candidate.weight;
    if (remaining < 0) {
      chosen = candidate.movie;
      break;
    }
  }

  if (favouriteIds.has(chosen.id)) {
    return { movie: chosen, reason: 'From your favourites. A saved story worth making time for.' };
  }
  const matchedGenre = chosen.genres
    .filter((genre) => preferences.has(genreKey(genre)))
    .sort((a, b) => (preferences.get(genreKey(b)) ?? 0) - (preferences.get(genreKey(a)) ?? 0))[0];
  return {
    movie: chosen,
    reason: matchedGenre
      ? `A little more ${matchedGenre.trim()}, inspired by your favourites.`
      : 'A fresh pick from the films you have loaded.',
  };
}
