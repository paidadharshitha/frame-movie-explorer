import type { PersonalRating } from '../state/library-store';
import type { WatchlistEntry } from '../state/watchlist-store';

export function getCinemaStats(entries: WatchlistEntry[], ratings: PersonalRating[]) {
  const uniqueEntries = [...new Map(entries.map((entry) => [entry.movie.id, entry])).values()];
  const watched = uniqueEntries.filter((entry) => entry.status === 'watched');
  const uniqueRatings = [...new Map(ratings.map((rating) => [rating.movie.id, rating])).values()];
  const genres = new Map<string, number>();
  for (const { movie } of watched) {
    for (const genre of new Set(movie.genres.map((value) => value.trim()).filter(Boolean))) {
      genres.set(genre, (genres.get(genre) ?? 0) + 1);
    }
  }
  const watchedSeries = watched.filter(({ movie }) => movie.mediaType === 'series').length;
  return {
    watchedCount: watched.length,
    plannedCount: uniqueEntries.length - watched.length,
    watchedMovies: watched.length - watchedSeries,
    watchedSeries,
    ratedCount: uniqueRatings.length,
    averageRating: uniqueRatings.length
      ? uniqueRatings.reduce((sum, { value }) => sum + value, 0) / uniqueRatings.length
      : null,
    topGenres: [...genres]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 5),
    highestRated: [...uniqueRatings]
      .sort((a, b) => b.value - a.value || b.ratedAt - a.ratedAt)
      .slice(0, 5),
  };
}
