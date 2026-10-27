import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { catalog, fetchMovie, fetchMovies, searchMovies } from '../api/movies';
import { useFavourites } from '../state/FavouritesProvider';
import type { Movie, MoviePage, SortOrder } from '../types/movie';

export const movieKeys = {
  lists: ['movies', catalog.id] as const,
  popular: (sort: SortOrder) => ['movies', catalog.id, 'list', sort] as const,
  search: (query: string) => ['movies', catalog.id, 'search', query] as const,
  detail: (id: string) => ['movie', id] as const,
};

export function useMovies(sort: SortOrder = 'popular') {
  return useInfiniteQuery({
    queryKey: movieKeys.popular(sort),
    queryFn: ({ pageParam, signal }) => fetchMovies(pageParam, sort, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

export function useMovieSearch(query: string) {
  const term = query.trim();
  return useInfiniteQuery({
    queryKey: movieKeys.search(term),
    queryFn: ({ pageParam, signal }) => searchMovies(term, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: term.length >= 2,
  });
}

export function useMovie(id: string) {
  const queryClient = useQueryClient();
  const { favourites } = useFavourites();
  const savedMovie = favourites.find((movie) => movie.id === id);
  const cachedMovie = queryClient
    .getQueriesData<InfiniteData<MoviePage>>({ queryKey: movieKeys.lists })
    .flatMap(([, data]) => data?.pages.flatMap((page) => page.movies) ?? [])
    .find((movie) => movie.id === id);
  const snapshot = savedMovie ?? cachedMovie;

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
