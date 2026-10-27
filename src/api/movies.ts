import type { Movie, MoviePage, SortOrder } from '../types/movie';
import { ApiError, getJson } from './client';
import {
  normalizeAnime,
  normalizeAnimePage,
  normalizeTmdb,
  normalizeTmdbPage,
  object,
} from './normalize';

const TMDB_TOKEN = process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN?.trim();
const ANIMATION_BASE = 'https://api.tenrai.org/v1';
const TMDB_BASE = 'https://api.themoviedb.org/3';

export const catalog = TMDB_TOKEN
  ? {
      id: 'tmdb',
      name: 'World cinema',
      description: 'Discover popular films from around the world.',
      ratingLabel: 'TMDB',
      attribution: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    }
  : {
      id: 'jikan',
      name: 'Animated cinema',
      description: 'Discover animated films, from beloved classics to your next favourite.',
      ratingLabel: 'MyAnimeList',
      attribution: 'Movie data and community scores from MyAnimeList, via the public Tenrai API.',
    };

/** Parse provider-prefixed IDs before putting them into a request path. */
export function getId(id: string): { provider: 'jikan' | 'tmdb'; value: number } {
  const match = /^(jikan|tmdb)-([1-9]\d*)$/.exec(id);
  const value = match ? Number(match[2]) : NaN;
  if (!match || !Number.isSafeInteger(value))
    throw new ApiError('This movie link is invalid.', { status: 400 });
  return { provider: match[1] as 'jikan' | 'tmdb', value };
}

function validPage(page: number) {
  if (!Number.isSafeInteger(page) || page < 1)
    throw new ApiError('This page is invalid.', { status: 400 });
}

export async function fetchMovies(
  page: number,
  sort: SortOrder,
  signal?: AbortSignal,
): Promise<MoviePage> {
  validPage(page);
  if (TMDB_TOKEN) {
    const endpoint = sort === 'top-rated' ? 'top_rated' : 'popular';
    const response = await getJson(
      `${TMDB_BASE}/movie/${endpoint}?language=en-US&page=${page}`,
      signal,
      TMDB_TOKEN,
    );
    return normalizeTmdbPage(response, page);
  }
  const filter = sort === 'popular' ? '&filter=bypopularity' : '';
  const response = await getJson(
    `${ANIMATION_BASE}/top/anime?type=movie&sfw=true&limit=24&page=${page}${filter}`,
    signal,
  );
  return normalizeAnimePage(response, page);
}

export async function searchMovies(
  query: string,
  page: number,
  signal?: AbortSignal,
): Promise<MoviePage> {
  validPage(page);
  const term = query.trim();
  if (!term) return { movies: [], nextPage: undefined, total: 0 };
  if (TMDB_TOKEN) {
    const response = await getJson(
      `${TMDB_BASE}/search/movie?query=${encodeURIComponent(term)}&include_adult=false&language=en-US&page=${page}`,
      signal,
      TMDB_TOKEN,
    );
    return normalizeTmdbPage(response, page);
  }
  const response = await getJson(
    `${ANIMATION_BASE}/anime?q=${encodeURIComponent(term)}&type=movie&sfw=true&limit=24&page=${page}`,
    signal,
  );
  return normalizeAnimePage(response, page);
}

export async function fetchMovie(id: string, signal?: AbortSignal): Promise<Movie> {
  const parsed = getId(id);
  let movie: Movie | null;
  if (parsed.provider === 'tmdb') {
    if (!TMDB_TOKEN)
      throw new ApiError('Add your TMDB access token to refresh this saved movie.', {
        status: 401,
      });
    const response = await getJson(
      `${TMDB_BASE}/movie/${parsed.value}?language=en-US&append_to_response=videos`,
      signal,
      TMDB_TOKEN,
    );
    movie = normalizeTmdb(response);
  } else {
    const response = await getJson(`${ANIMATION_BASE}/anime/${parsed.value}/full`, signal);
    movie = normalizeAnime(object(response).data);
  }
  if (!movie || movie.id !== id)
    throw new ApiError('The movie service returned an unexpected movie.', {
      kind: 'invalid-response',
    });
  return movie;
}
