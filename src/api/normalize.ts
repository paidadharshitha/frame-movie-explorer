import type { Movie, MoviePage } from '../types/movie';
import { ApiError } from './client';

type JsonObject = Record<string, unknown>;
export const object = (value: unknown): JsonObject =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {};
const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const number = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const positiveId = (value: unknown): number | undefined => {
  const id = number(value);
  return id && Number.isSafeInteger(id) && id > 0 ? id : undefined;
};

/** Only HTTPS URLs may reach image components or the external-link button. */
export function safeUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function score(value: unknown): number | null {
  const rating = number(value);
  return rating !== undefined && rating > 0 && rating <= 10 ? rating : null;
}

function yearOf(date: string, fallback?: unknown): string | null {
  const year = /^\d{4}-/.test(date) ? Number(date.slice(0, 4)) : number(fallback);
  return year && year >= 1880 && year <= 2200 ? String(year) : null;
}

function names(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => text(object(item).name)).filter(Boolean) : [];
}

export function normalizeAnime(input: unknown): Movie | null {
  const item = object(input);
  const id = positiveId(item.mal_id);
  const title = text(item.title_english) || text(item.title);
  if (!id || !title || item.type !== 'Movie') return null;
  const images = object(object(item.images).jpg);
  const trailer = object(item.trailer);
  const youtubeId = text(trailer.youtube_id);
  const releaseDate = text(object(item.aired).from);
  return {
    id: `jikan-${id}`,
    provider: 'jikan',
    title,
    originalTitle: text(item.title) || undefined,
    posterUrl: safeUrl(images.large_image_url) ?? safeUrl(images.image_url) ?? null,
    // Do not stretch a portrait poster into a pretend landscape still.
    backdropUrl: null,
    overview: text(item.synopsis),
    year: yearOf(releaseDate, item.year),
    rating: score(item.score),
    ratingCount: number(item.scored_by) ?? 0,
    genres: names(item.genres),
    runtime: text(item.duration) || null,
    releaseDate: releaseDate || undefined,
    trailerUrl: /^[\w-]{11}$/.test(youtubeId)
      ? `https://www.youtube.com/watch?v=${youtubeId}`
      : undefined,
    sourceUrl: `https://myanimelist.net/anime/${id}`,
  };
}

const TMDB_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

function tmdbImage(path: unknown, size: 'w500' | 'w1280'): string | null {
  return typeof path === 'string' && /^\/[\w-]+\.(jpg|png|webp)$/i.test(path)
    ? `https://image.tmdb.org/t/p/${size}${path}`
    : null;
}

export function normalizeTmdb(input: unknown): Movie | null {
  const item = object(input);
  const id = positiveId(item.id);
  const title = text(item.title);
  if (!id || !title) return null;
  const releaseDate = text(item.release_date);
  const minutes = number(item.runtime);
  const videoResults = object(item.videos).results;
  const trailer = Array.isArray(videoResults)
    ? videoResults
        .map(object)
        .find(
          (video) =>
            video.site === 'YouTube' &&
            video.type === 'Trailer' &&
            /^[\w-]{11}$/.test(text(video.key)),
        )
    : undefined;
  const genres = names(item.genres);
  return {
    id: `tmdb-${id}`,
    provider: 'tmdb',
    title,
    originalTitle: text(item.original_title) || undefined,
    posterUrl: tmdbImage(item.poster_path, 'w500'),
    backdropUrl: tmdbImage(item.backdrop_path, 'w1280'),
    overview: text(item.overview),
    year: yearOf(releaseDate),
    rating: score(item.vote_average),
    ratingCount: number(item.vote_count) ?? 0,
    genres: genres.length
      ? genres
      : Array.isArray(item.genre_ids)
        ? item.genre_ids
            .map((id) => (typeof id === 'number' ? TMDB_GENRES[id] : undefined))
            .filter((genre): genre is string => !!genre)
        : [],
    runtime:
      minutes && minutes > 0
        ? `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ''}${minutes % 60}m`
        : null,
    releaseDate: releaseDate || undefined,
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${text(trailer.key)}` : undefined,
    sourceUrl: `https://www.themoviedb.org/movie/${id}`,
  };
}

function invalidResponse(): never {
  throw new ApiError('The movie service returned an unexpected response. Please try again.', {
    kind: 'invalid-response',
  });
}

function moviesFrom(items: unknown, normalize: (value: unknown) => Movie | null): Movie[] {
  if (!Array.isArray(items)) return invalidResponse();
  const movies = items.map(normalize).filter((movie): movie is Movie => movie !== null);
  if (items.length && !movies.length) return invalidResponse();
  return [...new Map(movies.map((movie) => [movie.id, movie])).values()];
}

export function normalizeAnimePage(input: unknown, requestedPage: number): MoviePage {
  const response = object(input);
  const pagination = object(response.pagination);
  if (typeof pagination.has_next_page !== 'boolean') return invalidResponse();
  return {
    movies: moviesFrom(response.data, normalizeAnime),
    nextPage: pagination.has_next_page ? requestedPage + 1 : undefined,
    total: number(object(pagination.items).total) ?? null,
  };
}

export function normalizeTmdbPage(input: unknown, requestedPage: number): MoviePage {
  const response = object(input);
  const totalPages = number(response.total_pages);
  if (totalPages === undefined || totalPages < 0) return invalidResponse();
  return {
    movies: moviesFrom(response.results, normalizeTmdb),
    // TMDB only permits paging through the first 500 pages.
    nextPage: requestedPage < Math.min(totalPages, 500) ? requestedPage + 1 : undefined,
    total: number(response.total_results) ?? null,
  };
}
