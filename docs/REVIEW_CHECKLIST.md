# Frame review checklist

These are **test scenarios and expected behavior**, not a claim that every device or failure mode has been tested. Completed checks are recorded separately in [VALIDATION.md](VALIDATION.md). Record the platform, app build, provider, result, and any evidence when running additional checks. Use an emulator or a spare test device before deliberately disrupting storage or clearing app data.

## Preparation

- [ ] Install from a clean checkout with `npm ci` and run `npm run check`.
- [ ] Start the app and record the platform, screen size, provider, and build/commit.
- [ ] Confirm the default catalog is identified as animated movies and series, or enable TMDB and confirm that provider is identified. No TMDB token is supplied with the repository.
- [ ] Start with a fresh or disposable local library; use test-only profile information if testing comments. Do not include credentials or real profile details in evidence.
- [ ] Have a normal connection, a throttled connection, and an offline mode available. On a physical device, turn both Wi-Fi and mobile data off for the offline test.

## Core flow

| Scenario              | Steps                                               | Expected result                                                                                                     |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Initial load          | Clear app data, open Discover online                | Loading feedback appears, then real posters and titles; no blank screen or endless spinner                          |
| Pagination            | Scroll beyond the first page, then continue quickly | More movies appear once per page; earlier items remain; no duplicate cards or concurrent repeated page loads        |
| Pull-to-refresh       | Return to the top and pull down                     | A refresh indicator appears while existing content remains useful; the indicator ends after success or failure      |
| Details               | Open a movie, use back, and open another            | Correct poster, title, rating, and overview are shown; back returns to browsing without resetting the whole app     |
| Favourite             | Save from a card or details, then open Favourites   | The same title appears promptly, with the save state consistent across screens                                      |
| Remove favourite      | Remove a saved movie from Favourites                | The item is removed, the count and save icons update, and the empty state appears after removing the final item     |
| Persistent favourites | Save two movies, fully close the app, and relaunch  | Both movies remain saved after storage hydration; the screen does not briefly present a misleading empty collection |

## Search and request ordering

| Scenario                  | Steps                                                                                   | Expected result                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Debounce                  | Type a title continuously while watching network requests                               | The app waits for the input to settle rather than sending a request on every keystroke                   |
| Obsolete search           | Under throttling, search for one title, then immediately replace it with another        | The eventual results correspond to the current query; the old response does not overwrite the new search |
| Clear input               | Start a search, then clear it before the response arrives                               | The idle search state returns and no late response replaces it                                           |
| No results                | Search for an unlikely string such as `zzqvframe987`                                    | A clear no-results message appears, with an easy way to change the query                                 |
| Search pages              | Search a broad term and scroll to the end                                               | Additional results load for that exact query, with no previous query's pages mixed in                    |
| Media switch in flight    | Under throttling, search Movies and switch to Series before the response arrives        | Only the selected media type's results appear; the earlier request does not overwrite them               |
| Language switch in flight | With TMDB configured, change Telugu/Hindi/English during a search or browse request     | Results remain scoped to the selected original language and media type                                   |
| Filtered search page      | With TMDB, search a broad term in a language with no matches on the first returned page | A further-page action remains available when the provider has more pages; no unfiltered total is claimed |

## Movies, series, and deeper details

| Scenario                 | Steps                                                                | Expected result                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog switch           | Choose Movies, then Series, on Discover and Search                   | Each view uses the correct media type; switching back restores that query's data without mixing movie and series pages                       |
| Key-free scope           | Run without a TMDB token and inspect the catalog selector            | Animated movies/series remain usable; the scope is clear and language choices are not presented as working filters                           |
| Original language        | Configure TMDB, restart Metro, and choose Telugu, Hindi, or English  | Discover uses that original-language filter; this does not promise dubbed audio, subtitles, translation, or playback                         |
| Movie/series identity    | Open a TMDB movie and series with the same numeric provider ID       | Details, cache, favourites, ratings, and collections keep them distinct through `tmdb-…` and `tmdb-tv-…` IDs                                 |
| Cast and crew            | Open Behind the story → Cast & crew                                  | Provider-supplied actors/voice actors and director or other relevant crew appear with their roles; absent credits have an honest empty state |
| Related titles           | Open More like this and select a result                              | A recommendation opens its own details; provider-returned data is not presented as a locally calculated preference score                     |
| Optional-section failure | Fail a cast or recommendation request while a title is visible       | The poster/overview and personal actions remain usable; only the affected section shows loading, offline, or retry feedback                  |
| TMDB seasons             | Open a TMDB series, choose Episodes, then select another season      | The season-specific episode list changes; the previous season's response cannot replace it                                                   |
| Anime seasons            | Open an anime TV series and choose Episodes                          | The app explains that anime seasons are independent catalog titles; it does not invent a combined franchise season list                      |
| Episode details          | Expand and collapse an episode                                       | Available title/date/overview/rating are readable; missing overview data is identified clearly                                               |
| Long episode list        | Open a series with more than 20 episodes, then use Next and Previous | At most 20 episode rows appear on a visible page; more data loads only when required, and returning to a loaded page uses available data     |
| Episode page failure     | Fail or pause the next episode request                               | Existing episodes stay visible and recoverable; failed requests do not advance to an empty page                                              |
| Missing season data      | Open a series whose provider has no listed seasons/episodes          | A useful empty message appears without an endless spinner or invented episodes                                                               |

## Personal ratings, collections, and cinema stats

These are shared device features and work without demo sign-in. Community scores are out of 10; personal stars are out of 5.

| Scenario                   | Steps                                                                                                      | Expected result                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Personal rating            | Open an unrated title and choose 1–5 stars                                                                 | Your rating updates immediately and appears in Library → Your ratings; the title is also marked watched                 |
| Rating during hydration    | Delay initial reads for library or watchlist in a test build                                               | Rating controls wait for both stores before enabling, so a rating cannot silently lose the watched status               |
| Change and clear           | Change a personal rating, then Clear                                                                       | One rating per title is retained; Clear removes the rating but does not remove the watched entry                        |
| Rating and written review  | Rate a title, then add a comment with a disposable demo profile                                            | Personal stars and the written comment are both visible in details, with device-only scope and separate community score |
| First collection           | Open Library → Collections, use a suggested name, then create                                              | Suggestions fill the field without creating data automatically; creation opens an empty, named collection               |
| Collection validation      | Try blank names, repeated names with changed case, surrounding whitespace, and a name beyond 40 characters | Empty/duplicate names are rejected, whitespace is normalized, and the 40-character limit is enforced                    |
| Add to multiple lists      | Open a title, expand Add to a collection, and check two lists                                              | The title belongs to both lists once; checkboxes and counts agree across screens                                        |
| Create from details        | Create a new collection inside the title's collection controls                                             | The collection is created and the current title is added; validation errors stay beside the form                        |
| Rename                     | Open a collection, use its pencil action, and save a new name                                              | The same collection keeps its members and date; duplicate names are rejected                                            |
| Remove member and Undo     | Remove a title from a collection and select Undo                                                           | That title returns without duplicate membership; other collections, favourites, and watch status remain unchanged       |
| Delete collection and Undo | Delete a populated collection from Library and select Undo                                                 | Its name, titles, and creation date return; a conflicting newer collection is not overwritten                           |
| Collection limit           | In a test environment, create 50 collections and attempt one more                                          | The limit has clear feedback and existing lists remain intact                                                           |
| Rating order               | Rate two titles at different times and open Your ratings                                                   | Most recently rated titles appear first; tapping one opens details for editing                                          |
| Honest empty stats         | Open Stats with no watched titles or ratings                                                               | Counts are zero, average says Not rated yet, and useful next actions replace invented charts or watch hours             |
| Watched counts             | Watch one movie and one series, then plan another title                                                    | Stats report two watched titles, one watched movie and one watched series, plus one planned title                       |
| Genre counts               | Watch titles with overlapping genres and leave another planned                                             | Watched genres count once per title; planned titles do not contribute to favourite genres                               |
| Rating average and leaders | Give personal ratings of 5, 5, and 2, with the second 5 rated most recently                                | The average is 4.0/5; the newest tied five-star title leads the highest-rated list                                      |
| Local persistence          | Create/rename lists, change ratings, fully close the app, and relaunch                                     | Collections, membership, dates, and ratings survive; statistics recalculate from the restored data                      |

## Discovery and watch history

| Scenario              | Steps                                                               | Expected result                                                                                                         |
| --------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Personalised pick     | Save favourite films, then tap Surprise me                          | A loaded film appears with an honest reason; watched films are excluded and unsaved discoveries are preferred           |
| Repeat avoidance      | Tap Pick again with multiple eligible films                         | The immediate previous pick is avoided when an alternative exists                                                       |
| No eligible pick      | Mark all films in a filtered selection watched, then request a pick | A useful message explains that more films or different filters are needed                                               |
| Combined filters      | Select a genre, Rated 8+, and Hide watched                          | Every visible film matches; unrated films are excluded by the rating filter; the count identifies the loaded-film scope |
| Filtered pagination   | Apply a restrictive filter, then use Load more films                | New pages expand the locally filtered selection; filtering alone does not drain every API page                          |
| Empty filter result   | Choose filters with no match among loaded films                     | Clear filters and, when available, Load more films remain usable                                                        |
| Plan a watch          | Add a film from details and open Watchlist                          | It appears in Planned; its card and detail status agree; Favourites are unchanged                                       |
| Watch and re-plan     | Mark a planned film watched, then choose Watch later                | It moves between the two lists with correct counts; the original added date is preserved                                |
| Remove and Undo       | Remove a watched entry and tap Undo within eight seconds            | The entry returns with its original status and timestamps                                                               |
| Watchlist persistence | Add planned and watched films, fully close the app, and relaunch    | Both lists and their statuses survive hydration                                                                         |

## Local demo profiles and comments

Use test names and email addresses. This flow is device-only demo identity, without passwords, email verification, server authentication, or shared online comments.

| Scenario              | Steps                                                                                                    | Expected result                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Guest browsing        | Open the app without signing in and browse/search/open details                                           | All browsing remains available; commenting invites a local sign-in                                   |
| Demo sign-in          | Open the header's person icon and enter a display name and email                                         | The local profile becomes active; the screen explains the demo scope and does not ask for a password |
| Input validation      | Try an empty/one-character name or a malformed email                                                     | A clear validation message appears without creating a profile                                        |
| Session restart       | Sign in, fully close the app, and relaunch                                                               | The same local profile is restored after hydration                                                   |
| Identity reuse        | Post a comment, sign out, and sign in with the same email using different casing                         | The original profile identity is reused and its own-comment actions return                           |
| Shared device library | Save favourites, watchlist entries, personal ratings, and custom collections, then switch local profiles | All remain available; the app does not imply account-specific cloud storage                          |
| Post comment          | Open a movie or series and post a comment with surrounding whitespace                                    | The trimmed text appears under the active display name on that title only                            |
| Comment validation    | Try blank text and the 1,000-character limit                                                             | Blank comments are rejected; accepted comments stay within the limit                                 |
| Spoiler               | Post a spoiler-marked comment, then reveal its text                                                      | Spoiler text is hidden until explicitly revealed                                                     |
| Own-comment actions   | Switch to a different local profile and inspect an earlier comment                                       | The other profile cannot delete the earlier profile's comment                                        |
| Delete and Undo       | Delete an own comment, then tap Undo within eight seconds                                                | Original text, author, spoiler flag, and date are restored without duplication                       |
| Sign out              | Sign out after posting and revisit the film                                                              | Comments remain readable; posting requires signing in again                                          |
| About navigation      | Open the profile screen and choose About Frame                                                           | Attribution and app information remain reachable                                                     |

## Slow and lost networks

| Scenario                 | Steps                                                                                                        | Expected result                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Slow first request       | Clear cache and enable network throttling                                                                    | Skeleton/loading UI stays responsive; navigation and input remain usable                                                  |
| First request fails      | Open without a cached catalog while offline                                                                  | An understandable offline/error state appears with a recovery path; it is not presented as an empty API result            |
| Refresh fails with data  | Load Discover online, disconnect, then pull to refresh                                                       | Existing cards remain visible; offline/error feedback explains the failure; refreshing does not spin forever              |
| Next page fails          | Load one page, disconnect, and scroll to the end                                                             | The loaded page remains; a footer message or retry action explains why more movies did not arrive                         |
| Resume connection        | Reconnect after a failed request                                                                             | The app resumes or can be retried without a restart; duplicate movies are not appended                                    |
| Cached cold launch       | Load Discover and a detail online, allow storage to finish, close the app, disconnect, and relaunch          | Persisted movie metadata appears; connectivity feedback is visible; previously visited details remain usable when cached  |
| Saved detail offline     | Save a film, close the app, relaunch offline, and open it from Favourites                                    | Its saved metadata remains useful; any unavailable additional data is handled gracefully                                  |
| Watchlist offline        | Add a film to Watchlist, close the app, relaunch offline, and open that film                                 | Its stored metadata remains useful even if the query cache expired; missing poster data uses a placeholder                |
| Library offline          | Add a title only to a custom collection, expire its query cache in a test environment, then relaunch offline | The collection and title's saved metadata remain usable; missing images and optional detail sections have fallbacks       |
| Personal actions offline | With hydrated stores, disconnect and rate a title, manage collections, and view Stats                        | Local actions remain responsive, changes persist, and statistics update without an API call                               |
| Optional details offline | Visit Cast & crew or Episodes online, then retry after disconnecting                                         | Cached section data can remain available; uncached sections explain the connection requirement without blocking the title |
| Discovery offline        | Load films, disconnect, then change filters or request a surprise pick                                       | Local filtering and picks work without a new request; watched films remain excluded                                       |
| Local comments offline   | Load a film, disconnect, sign in to a demo profile, and post/delete/undo a comment                           | These local actions remain available; the UI does not claim to publish comments online                                    |
| Unseen detail offline    | Open a detail that has never been fetched while offline                                                      | A helpful fallback or recoverable error appears; it does not show another film's details                                  |
| Poster request fails     | Block the image host or use a fresh offline cache                                                            | A stable poster placeholder appears without breaking the card layout                                                      |
| API limit/error          | Mock a `429` or `5xx` response in a test environment                                                         | The app uses bounded retry/recovery; it does not loop or clear valid cached content                                       |

The persisted query cache has a 24-hour retention policy and keeps up to 12 recent queries and the first two pages of each list, below a 750 KB size bound. Do not interpret intentionally expired or evicted data as a guarantee of permanent offline access. Image caching is independent from metadata caching.

## Device storage and state

| Scenario                      | Steps                                                                                                  | Expected result                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Rapid toggles                 | Quickly save/remove the same title, then save several titles                                           | Final state matches the latest action; no duplicate favourites; a later restart matches the stored state            |
| Storage write fails           | In a test build, make `AsyncStorage.setItem` reject for the favourites key                             | The failure is visible; the UI does not silently promise persistence; retry or another save can recover             |
| Storage read fails            | Make the initial favourites read reject                                                                | The app remains usable and explains that saved content could not be restored                                        |
| Damaged storage               | Put invalid JSON or an invalid record in the favourites key in a test environment                      | App startup does not crash; invalid data is handled without unsafe assumptions                                      |
| Query cache independent       | Save a movie, expire or clear only the query cache, then relaunch                                      | Favourites remain because they use a separate storage key                                                           |
| Watchlist storage failure     | Make the watchlist read or write reject in a test build                                                | A recoverable error appears; a failed initial read blocks changes and leaves the stored data untouched              |
| Watchlist rapid changes       | Quickly plan, mark watched, and remove several entries                                                 | The latest state wins, writes remain ordered, and a restart matches the saved state                                 |
| Independent personal stores   | Clear only the query cache after adding favourites, watchlist entries, ratings, and custom collections | All personal data remains under its own non-expiring storage keys                                                   |
| Library write failure         | Make writes to `@frame/library/v1` reject, then change ratings, names, or membership                   | Optimistic changes stay in memory with visible Retry; recovery saves the latest complete snapshot                   |
| Library read failure          | Make the library read fail or include one corrupt rating/collection record                             | The entire stored envelope remains untouched; mutations stay blocked until successful recovery                      |
| Rapid library changes         | Quickly change ratings, add/remove collection titles, and rename a list                                | Serialized writes retain the final state across relaunch, with no stale write winning                               |
| Profile/comment write failure | Make writes to `@frame/community/v1` reject in a test build, then post or sign out                     | Current state stays in memory with a visible retry; recovery persists the latest profile and comment state together |
| Profile/comment read failure  | Make the initial community read fail or supply a malformed envelope                                    | Profile/comment changes wait for successful recovery, and existing stored data is not overwritten                   |
| Rapid local actions           | Sign in, post/delete comments, sign out, and restart after storage finishes                            | The restored session and comments match the final actions, with no stale write winning                              |

## Appearance and interaction

| Scenario                  | Steps                                                                                            | Expected result                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Guest appearance controls | Open the account screen as a guest                                                               | Appearance is available without sign-in, with System, Light, and Dark choices                                    |
| Light and dark            | Switch appearance and visit Discover, Search, details, comments, Library, and collection details | Navigation, text, controls, input placeholders, errors, and loading states use the selected palette consistently |
| System appearance         | Choose System, then change the device's light/dark preference                                    | The app follows the device without requiring a restart                                                           |
| Theme restart             | Choose a fixed mode, fully close the app, and relaunch                                           | The selected mode is restored from `@frame/theme/v1`                                                             |
| Theme storage failure     | Fail initial theme reads or later writes in a test build                                         | A retry path appears; unreadable stored preferences are not silently overwritten                                 |
| Button feedback           | Press standard action and icon buttons                                                           | Subtle press feedback appears without delaying the action or changing layout                                     |
| Reduced motion            | Enable the system reduced-motion preference and navigate/press buttons                           | Scale feedback and navigation transitions are disabled while controls remain usable                              |

## Usability and release

- [ ] Use Android back navigation from details and tabs; confirm there is no navigation trap.
- [ ] Check a small phone, a larger phone, and the web preview for clipping and readable text.
- [ ] Increase system text size and verify essential labels and actions remain accessible.
- [ ] Navigate with VoiceOver/TalkBack: poster cards, save toggles, filters, personal stars, collection controls, episode disclosure, theme choices, watchlist actions, profile fields, comments, Undo, retry actions, and tabs have understandable labels and state.
- [ ] Verify personal stars, tabs, and essential controls have usable touch targets at small phone sizes.
- [ ] Scroll several pages and type while images load; no repeated full-screen spinners or frozen input.
- [ ] Check the relevant API attribution and provider scope before recording.
- [ ] Run both Expo export commands. If submitting an APK, build it through EAS, install it, and test this exact artifact.
- [ ] Share a real repository URL and a working build/recording URL; verify their access from a signed-out browser when appropriate.

## Run log

| Date | Platform / build | Provider | Scenario | Result / evidence |
| ---- | ---------------- | -------- | -------- | ----------------- |

Add measured results here after executing the checks. Keep failed or blocked scenarios visible with a short explanation.
