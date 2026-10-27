/** A provider-independent movie, safe to persist with the user's favourites. */
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
}

export interface MoviePage {
  movies: Movie[];
  nextPage: number | undefined;
  total: number | null;
}

export type SortOrder = 'popular' | 'top-rated';
