import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  catalog,
  defaultBrowseOptions,
  fetchMovie,
  fetchMovies,
  searchMovies,
} from '../api/movies';
import { useFavourites } from '../state/FavouritesProvider';
import { useWatchlist } from '../state/WatchlistProvider';
import { useLibrary } from '../state/LibraryProvider';
import type { BrowseOptions, Movie, MoviePage, SortOrder } from '../types/movie';

export const movieKeys = {
  lists: ['movies', catalog.id] as const,
  popular: (sort: SortOrder, options: BrowseOptions = defaultBrowseOptions) =>
    ['movies', catalog.id, 'list', sort, options.mediaType, options.language] as const,
  search: (query: string, options: BrowseOptions = defaultBrowseOptions) =>
    ['movies', catalog.id, 'search', query, options.mediaType, options.language] as const,
  detail: (id: string) => ['movie', id] as const,
};

export function useMovies(
  sort: SortOrder = 'popular',
  options: BrowseOptions = defaultBrowseOptions,
) {
  return useInfiniteQuery({
    queryKey: movieKeys.popular(sort, options),
    queryFn: ({ pageParam, signal }) => fetchMovies(pageParam, sort, signal, options),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

export function useMovieSearch(query: string, options: BrowseOptions = defaultBrowseOptions) {
  const term = query.trim();
  return useInfiniteQuery({
    queryKey: movieKeys.search(term, options),
    queryFn: ({ pageParam, signal }) => searchMovies(term, pageParam, signal, options),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: term.length >= 2,
  });
}

export function useMovie(id: string) {
  const queryClient = useQueryClient();
  const { favourites } = useFavourites();
  const { entries } = useWatchlist();
  const { ratings, collections } = useLibrary();
  const savedMovie = favourites.find((movie) => movie.id === id);
  const cachedMovie = queryClient
    .getQueriesData<InfiniteData<MoviePage>>({ queryKey: movieKeys.lists })
    .flatMap(([, data]) => data?.pages.flatMap((page) => page.movies) ?? [])
    .find((movie) => movie.id === id);
  const watchlistMovie = entries.find((entry) => entry.movie.id === id)?.movie;
  const libraryMovie =
    ratings.find((rating) => rating.movie.id === id)?.movie ??
    collections.flatMap((collection) => collection.movies).find((movie) => movie.id === id);
  const snapshot = savedMovie ?? watchlistMovie ?? libraryMovie ?? cachedMovie;

  const query = useQuery({
    queryKey: movieKeys.detail(id),
    queryFn: ({ signal }) => fetchMovie(id, signal),
    enabled: Boolean(id),
    initialData: snapshot,
    // Lists contain everything needed to render immediately; still fetch full details.
    initialDataUpdatedAt: 0,
  });

  // A saved collection may hydrate after a direct detail link starts loading.
  // Keep that complete snapshot usable even when the network request failed.
  return { ...query, data: query.data ?? snapshot };
}

/** Infinite pages can overlap when the provider's popularity rankings change. */
export function flattenMovies(data: InfiniteData<MoviePage> | undefined): Movie[] {
  return [
    ...new Map(
      data?.pages.flatMap((page) => page.movies).map((movie) => [movie.id, movie]),
    ).values(),
  ];
}
