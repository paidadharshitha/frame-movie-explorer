import type { BrowseOptions, MediaType, Movie, MoviePage, SortOrder } from '../types/movie';
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
export const defaultBrowseOptions: BrowseOptions = { mediaType: 'movie', language: 'all' };

export const catalog = TMDB_TOKEN
  ? {
      id: 'tmdb',
      name: 'World cinema',
      description: 'Discover films and series from around the world.',
      ratingLabel: 'TMDB',
      attribution: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    }
  : {
      id: 'jikan',
      name: 'Animated cinema',
      description:
        'Discover animated films and series, from beloved classics to your next favourite.',
      ratingLabel: 'MyAnimeList',
      attribution: 'Title data and community scores from MyAnimeList, via the public Tenrai API.',
    };

/** Parse provider-prefixed IDs before putting them into a request path. */
export function getId(id: string): {
  provider: 'jikan' | 'tmdb';
  value: number;
  mediaType?: MediaType;
} {
  const match = /^(jikan|tmdb)-(tv-)?([1-9]\d*)$/.exec(id);
  const value = match ? Number(match[3]) : NaN;
  if (!match || !Number.isSafeInteger(value) || (match[1] === 'jikan' && match[2]))
    throw new ApiError('This title link is invalid.', { status: 400 });
  return {
    provider: match[1] as 'jikan' | 'tmdb',
    value,
    // Preserve legacy IDs and callers; Jikan's ID alone does not identify its media type.
    ...(match[2] ? { mediaType: 'series' as const } : {}),
  };
}

export function providerRequest(provider: 'jikan' | 'tmdb', path: string, signal?: AbortSignal) {
  if (provider === 'tmdb') {
    if (!TMDB_TOKEN)
      throw new ApiError('Add your TMDB access token to refresh this saved title.', {
        status: 401,
      });
    return getJson(`${TMDB_BASE}${path}`, signal, TMDB_TOKEN);
  }
  return getJson(`${ANIMATION_BASE}${path}`, signal);
}

function validPage(page: number) {
  if (!Number.isSafeInteger(page) || page < 1)
    throw new ApiError('This page is invalid.', { status: 400 });
}

function validateOptions(options: BrowseOptions) {
  if (
    !['movie', 'series'].includes(options.mediaType) ||
    !['all', 'te', 'hi', 'en'].includes(options.language)
  )
    throw new ApiError('These browse options are invalid.', { status: 400 });
  if (!TMDB_TOKEN && options.language !== 'all')
    throw new ApiError(
      'Language browsing needs a TMDB access token. The free catalog has animated movies and series.',
      { status: 400 },
    );
}

export async function fetchMovies(
  page: number,
  sort: SortOrder,
  signal?: AbortSignal,
  options: BrowseOptions = defaultBrowseOptions,
): Promise<MoviePage> {
  validPage(page);
  validateOptions(options);
  if (TMDB_TOKEN) {
    const type = options.mediaType === 'series' ? 'tv' : 'movie';
    const endpoint = sort === 'top-rated' ? 'top_rated' : 'popular';
    const path =
      options.language === 'all'
        ? `/${type}/${endpoint}?language=en-US&page=${page}`
        : `/discover/${type}?include_adult=false&language=en-US&page=${page}&with_original_language=${options.language}&sort_by=${sort === 'top-rated' ? 'vote_average.desc&vote_count.gte=50' : 'popularity.desc'}`;
    return normalizeTmdbPage(await providerRequest('tmdb', path, signal), page, options.mediaType);
  }
  const filter = sort === 'popular' ? '&filter=bypopularity' : '';
  const response = await providerRequest(
    'jikan',
    `/top/anime?type=${options.mediaType === 'series' ? 'tv' : 'movie'}&sfw=true&limit=24&page=${page}${filter}`,
    signal,
  );
  return normalizeAnimePage(response, page, options.mediaType);
}

export async function searchMovies(
  query: string,
  page: number,
  signal?: AbortSignal,
  options: BrowseOptions = defaultBrowseOptions,
): Promise<MoviePage> {
  validPage(page);
  validateOptions(options);
  const term = query.trim();
  if (!term) return { movies: [], nextPage: undefined, total: 0 };
  if (TMDB_TOKEN) {
    const response = await providerRequest(
      'tmdb',
      `/search/${options.mediaType === 'series' ? 'tv' : 'movie'}?query=${encodeURIComponent(term)}&include_adult=false&language=en-US&page=${page}`,
      signal,
    );
    const result = normalizeTmdbPage(response, page, options.mediaType);
    if (options.language === 'all') return result;
    // Search has no server-side original-language filter. Keep real pagination so
    // callers can load further pages even when this page has no language matches.
    const raw = object(response).results as unknown[];
    const allowed = new Set(
      raw
        .filter((item) => object(item).original_language === options.language)
        .map((item) => object(item).id),
    );
    return {
      ...result,
      movies: result.movies.filter((movie) => allowed.has(getId(movie.id).value)),
      total: null,
    };
  }
  const response = await providerRequest(
    'jikan',
    `/anime?q=${encodeURIComponent(term)}&type=${options.mediaType === 'series' ? 'tv' : 'movie'}&sfw=true&limit=24&page=${page}`,
    signal,
  );
  return normalizeAnimePage(response, page, options.mediaType);
}

export async function fetchMovie(id: string, signal?: AbortSignal): Promise<Movie> {
  const parsed = getId(id);
  let movie: Movie | null;
  if (parsed.provider === 'tmdb') {
    const response = await providerRequest(
      'tmdb',
      `/${parsed.mediaType === 'series' ? 'tv' : 'movie'}/${parsed.value}?language=en-US&append_to_response=videos`,
      signal,
    );
    movie = normalizeTmdb(response, parsed.mediaType ?? 'movie');
  } else {
    const response = await providerRequest('jikan', `/anime/${parsed.value}/full`, signal);
    movie = normalizeAnime(object(response).data, 'all');
  }
  if (!movie || movie.id !== id)
    throw new ApiError('The movie service returned an unexpected title.', {
      kind: 'invalid-response',
    });
  return movie;
}
