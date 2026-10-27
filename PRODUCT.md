# Frame

A React Native movie and series explorer for discovering, searching, and saving stories on a phone, including on unreliable mobile connections.

## Audience and purpose
Movie lovers choosing something to watch, and reviewers evaluating a working app. The user prioritizes functionality, clear structure, smooth UX, and sensible state management. Browsing needs no login. An optional device-only demo sign-in uses a name and unverified email to attribute local film comments; it collects no password and provides no real authentication or shared discussion service.

## Product requirements
Popular movies with infinite pagination and pull-to-refresh; debounced search; navigable details with poster, numeric rating, and overview; persistent favourites in a separate tab; loading, empty, and recoverable error states; useful behavior after the network drops.

Local demo profiles support sign-in, sign-out, and persistent film comments with spoiler hiding and own-comment removal with Undo. Comments and profile data stay on this device; favourites and watchlists are shared device collections, not profile-specific cloud data.

Movie/series selection and original-language browsing (Telugu, Hindi, English with TMDB), cast/crew, related titles, seasons/episodes, personal 1–5 star ratings, named custom collections, and cinema statistics derived from watched titles and ratings. Ratings and collections remain device-wide. Persistent Light/Dark/System appearance and reduced-motion-aware feedback preserve the existing identity.

## Stack
Expo, React Native, TypeScript, Expo Router, TanStack Query, AsyncStorage. Android is the primary target, with iOS support and a responsive web preview. A live Jikan-compatible animated movie and TV catalog works without keys. Anime seasons appear as independent catalog titles. An optional TMDB token enables general movies/series and original-language filters. The default catalog must be clearly identified as animated movies and series. Never invent ratings, season groupings, cast, or live data.

## Experience
Phone-first browsing with prominent real posters, legible titles, clear ratings, and quick save actions. Returning users should retain favourites and cached films after a cold launch. Slow networks should preserve the current screen, explain failures, and allow recovery.

## Deliverables
Working app, readable source, meaningful tests, README, GitHub repository, plus a runnable Expo entry point or a short screen recording. Publishing depends on available connected account access; never claim unbuilt binaries or untested device behavior.
