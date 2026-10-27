import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  fetchMediaPeople,
  fetchSeasonEpisodes,
  fetchSeriesSeasons,
  fetchSimilarMedia,
} from '../api/media-extras';

// Separate queries keep optional sections from blocking a title's main details.
export function useMediaPeople(id: string) {
  return useQuery({
    queryKey: ['media-people', id],
    queryFn: ({ signal }) => fetchMediaPeople(id, signal),
    enabled: !!id,
  });
}

export function useSimilarMedia(id: string) {
  return useQuery({
    queryKey: ['similar-media', id],
    queryFn: ({ signal }) => fetchSimilarMedia(id, signal),
    enabled: !!id,
  });
}

export function useSeriesSeasons(id: string, enabled = true) {
  return useQuery({
    queryKey: ['series-seasons', id],
    queryFn: ({ signal }) => fetchSeriesSeasons(id, signal),
    enabled: !!id && enabled,
  });
}

export function useSeasonEpisodes(id: string, seasonNumber: number, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['season-episodes', id, seasonNumber],
    queryFn: ({ signal, pageParam }) => fetchSeasonEpisodes(id, seasonNumber, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!id && enabled,
  });
}
