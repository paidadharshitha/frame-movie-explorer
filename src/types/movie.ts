export type MediaType = 'movie' | 'series';
export type CatalogLanguage = 'all' | 'te' | 'hi' | 'en';

export interface BrowseOptions {
  mediaType: MediaType;
  language: CatalogLanguage;
}

/** A provider-independent title; missing mediaType in saved v1 data means movie. */
export interface Movie {
  id: string;
  provider: 'jikan' | 'tmdb';
  title: string;
  originalTitle?: string;
  posterUrl: string | null;
  backdropUrl?: string | null;
  overview: string;
  year: string | null;
  rating: number | null;
  ratingCount?: number;
  genres: string[];
  runtime?: string | null;
  releaseDate?: string;
  trailerUrl?: string;
  sourceUrl?: string;
  mediaType?: MediaType;
  episodeCount?: number;
  seasonCount?: number;
  status?: string;
}

export interface MoviePage {
  movies: Movie[];
  nextPage: number | undefined;
  total: number | null;
}

export type SortOrder = 'popular' | 'top-rated';

export interface PersonCredit {
  id: string;
  name: string;
  role: string;
  imageUrl: string | null;
}

export interface MediaPeople {
  cast: PersonCredit[];
  crew: PersonCredit[];
}

export interface Season {
  number: number;
  name: string;
  episodeCount?: number;
  overview?: string;
  posterUrl?: string | null;
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  overview?: string;
  airDate?: string;
  rating?: number | null;
}

export interface EpisodePage {
  episodes: Episode[];
  nextPage?: number;
}
