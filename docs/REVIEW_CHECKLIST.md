# Frame review checklist

These are **test scenarios and expected behavior**, not a claim that every device or failure mode has been tested. Completed checks are recorded separately in [VALIDATION.md](VALIDATION.md). Record the platform, app build, provider, result, and any evidence when running additional checks. Use an emulator or a spare test device before deliberately disrupting storage or clearing app data.

## Preparation

- [ ] Install from a clean checkout with `npm ci` and run `npm run check`.
- [ ] Start the app and record the platform, screen size, provider, and build/commit.
- [ ] Confirm the default catalog is identified as animated films, or enable TMDB and confirm that provider is identified.
- [ ] Have a normal connection, a throttled connection, and an offline mode available. On a physical device, turn both Wi-Fi and mobile data off for the offline test.

## Core flow

| Scenario | Steps | Expected result |
| --- | --- | --- |
| Initial load | Clear app data, open Discover online | Loading feedback appears, then real posters and titles; no blank screen or endless spinner |
| Pagination | Scroll beyond the first page, then continue quickly | More movies appear once per page; earlier items remain; no duplicate cards or concurrent repeated page loads |
| Pull-to-refresh | Return to the top and pull down | A refresh indicator appears while existing content remains useful; the indicator ends after success or failure |
| Details | Open a movie, use back, and open another | Correct poster, title, rating, and overview are shown; back returns to browsing without resetting the whole app |
| Favourite | Save from a card or details, then open Favourites | The same title appears promptly, with the save state consistent across screens |
| Remove favourite | Remove a saved movie from Favourites | The item is removed, the count and save icons update, and the empty state appears after removing the final item |
| Persistent favourites | Save two movies, fully close the app, and relaunch | Both movies remain saved after storage hydration; the screen does not briefly present a misleading empty collection |

## Search and request ordering

| Scenario | Steps | Expected result |
| --- | --- | --- |
| Debounce | Type a title continuously while watching network requests | The app waits for the input to settle rather than sending a request on every keystroke |
| Obsolete search | Under throttling, search for one title, then immediately replace it with another | The eventual results correspond to the current query; the old response does not overwrite the new search |
| Clear input | Start a search, then clear it before the response arrives | The idle search state returns and no late response replaces it |
| No results | Search for an unlikely string such as `zzqvframe987` | A clear no-results message appears, with an easy way to change the query |
| Search pages | Search a broad term and scroll to the end | Additional results load for that exact query, with no previous query's pages mixed in |

## Discovery and watch history

| Scenario | Steps | Expected result |
| --- | --- | --- |
| Personalised pick | Save favourite films, then tap Surprise me | A loaded film appears with an honest reason; watched films are excluded and unsaved discoveries are preferred |
| Repeat avoidance | Tap Pick again with multiple eligible films | The immediate previous pick is avoided when an alternative exists |
| No eligible pick | Mark all films in a filtered selection watched, then request a pick | A useful message explains that more films or different filters are needed |
| Combined filters | Select a genre, Rated 8+, and Hide watched | Every visible film matches; unrated films are excluded by the rating filter; the count identifies the loaded-film scope |
| Filtered pagination | Apply a restrictive filter, then use Load more films | New pages expand the locally filtered selection; filtering alone does not drain every API page |
| Empty filter result | Choose filters with no match among loaded films | Clear filters and, when available, Load more films remain usable |
| Plan a watch | Add a film from details and open Watchlist | It appears in Planned; its card and detail status agree; Favourites are unchanged |
| Watch and re-plan | Mark a planned film watched, then choose Watch later | It moves between the two lists with correct counts; the original added date is preserved |
| Remove and Undo | Remove a watched entry and tap Undo within eight seconds | The entry returns with its original status and timestamps |
| Watchlist persistence | Add planned and watched films, fully close the app, and relaunch | Both lists and their statuses survive hydration |

## Local demo profiles and comments

Use test names and email addresses. This flow is device-only demo identity, without passwords, email verification, server authentication, or shared online comments.

| Scenario | Steps | Expected result |
| --- | --- | --- |
| Guest browsing | Open the app without signing in and browse/search/open details | All browsing remains available; commenting invites a local sign-in |
| Demo sign-in | Open the header's person icon and enter a display name and email | The local profile becomes active; the screen explains the demo scope and does not ask for a password |
| Input validation | Try an empty/one-character name or a malformed email | A clear validation message appears without creating a profile |
| Session restart | Sign in, fully close the app, and relaunch | The same local profile is restored after hydration |
| Identity reuse | Post a comment, sign out, and sign in with the same email using different casing | The original profile identity is reused and its own-comment actions return |
| Shared device collections | Save favourites and watchlist entries, then switch local profiles | Both collections stay available; the app does not imply account-specific cloud storage |
| Post comment | Open a film and post a comment with surrounding whitespace | The trimmed text appears under the active display name on that film only |
| Comment validation | Try blank text and the 1,000-character limit | Blank comments are rejected; accepted comments stay within the limit |
| Spoiler | Post a spoiler-marked comment, then reveal its text | Spoiler text is hidden until explicitly revealed |
| Own-comment actions | Switch to a different local profile and inspect an earlier comment | The other profile cannot delete the earlier profile's comment |
| Delete and Undo | Delete an own comment, then tap Undo within eight seconds | Original text, author, spoiler flag, and date are restored without duplication |
| Sign out | Sign out after posting and revisit the film | Comments remain readable; posting requires signing in again |
| About navigation | Open the profile screen and choose About Frame | Attribution and app information remain reachable |

## Slow and lost networks

| Scenario | Steps | Expected result |
| --- | --- | --- |
| Slow first request | Clear cache and enable network throttling | Skeleton/loading UI stays responsive; navigation and input remain usable |
| First request fails | Open without a cached catalog while offline | An understandable offline/error state appears with a recovery path; it is not presented as an empty API result |
| Refresh fails with data | Load Discover online, disconnect, then pull to refresh | Existing cards remain visible; offline/error feedback explains the failure; refreshing does not spin forever |
| Next page fails | Load one page, disconnect, and scroll to the end | The loaded page remains; a footer message or retry action explains why more movies did not arrive |
| Resume connection | Reconnect after a failed request | The app resumes or can be retried without a restart; duplicate movies are not appended |
| Cached cold launch | Load Discover and a detail online, allow storage to finish, close the app, disconnect, and relaunch | Persisted movie metadata appears; connectivity feedback is visible; previously visited details remain usable when cached |
| Saved detail offline | Save a film, close the app, relaunch offline, and open it from Favourites | Its saved metadata remains useful; any unavailable additional data is handled gracefully |
| Watchlist offline | Add a film to Watchlist, close the app, relaunch offline, and open that film | Its stored metadata remains useful even if the query cache expired; missing poster data uses a placeholder |
| Discovery offline | Load films, disconnect, then change filters or request a surprise pick | Local filtering and picks work without a new request; watched films remain excluded |
| Local comments offline | Load a film, disconnect, sign in to a demo profile, and post/delete/undo a comment | These local actions remain available; the UI does not claim to publish comments online |
| Unseen detail offline | Open a detail that has never been fetched while offline | A helpful fallback or recoverable error appears; it does not show another film's details |
| Poster request fails | Block the image host or use a fresh offline cache | A stable poster placeholder appears without breaking the card layout |
| API limit/error | Mock a `429` or `5xx` response in a test environment | The app uses bounded retry/recovery; it does not loop or clear valid cached content |

The persisted query cache has a 24-hour retention policy and keeps up to 12 recent queries and the first two pages of each list, below a 750 KB size bound. Do not interpret intentionally expired or evicted data as a guarantee of permanent offline access. Image caching is independent from metadata caching.

## Device storage and state

| Scenario | Steps | Expected result |
| --- | --- | --- |
| Rapid toggles | Quickly save/remove the same title, then save several titles | Final state matches the latest action; no duplicate favourites; a later restart matches the stored state |
| Storage write fails | In a test build, make `AsyncStorage.setItem` reject for the favourites key | The failure is visible; the UI does not silently promise persistence; retry or another save can recover |
| Storage read fails | Make the initial favourites read reject | The app remains usable and explains that saved content could not be restored |
| Damaged storage | Put invalid JSON or an invalid record in the favourites key in a test environment | App startup does not crash; invalid data is handled without unsafe assumptions |
| Query cache independent | Save a movie, expire or clear only the query cache, then relaunch | Favourites remain because they use a separate storage key |
| Watchlist storage failure | Make the watchlist read or write reject in a test build | A recoverable error appears; a failed initial read blocks changes and leaves the stored data untouched |
| Watchlist rapid changes | Quickly plan, mark watched, and remove several entries | The latest state wins, writes remain ordered, and a restart matches the saved state |
| Independent collections | Clear only the query cache after adding favourites and watchlist entries | Both personal collections remain under their own storage keys |
| Profile/comment write failure | Make writes to `@frame/community/v1` reject in a test build, then post or sign out | Current state stays in memory with a visible retry; recovery persists the latest profile and comment state together |
| Profile/comment read failure | Make the initial community read fail or supply a malformed envelope | Profile/comment changes wait for successful recovery, and existing stored data is not overwritten |
| Rapid local actions | Sign in, post/delete comments, sign out, and restart after storage finishes | The restored session and comments match the final actions, with no stale write winning |

## Usability and release

- [ ] Use Android back navigation from details and tabs; confirm there is no navigation trap.
- [ ] Check a small phone, a larger phone, and the web preview for clipping and readable text.
- [ ] Increase system text size and verify essential labels and actions remain accessible.
- [ ] Navigate with VoiceOver/TalkBack: poster cards, save toggles, filters, watchlist actions, profile fields, comment/spoiler controls, Undo, retry actions, and tabs have understandable labels.
- [ ] Scroll several pages and type while images load; no repeated full-screen spinners or frozen input.
- [ ] Check the relevant API attribution and provider scope before recording.
- [ ] Run both Expo export commands. If submitting an APK, build it through EAS, install it, and test this exact artifact.
- [ ] Share a real repository URL and a working build/recording URL; verify their access from a signed-out browser when appropriate.

## Run log

| Date | Platform / build | Provider | Scenario | Result / evidence |
| --- | --- | --- | --- | --- |

Add measured results here after executing the checks. Keep failed or blocked scenarios visible with a short explanation.
