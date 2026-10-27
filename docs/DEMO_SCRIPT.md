# Two-minute Frame demo

This is a reusable recording plan. The submitted [Frame demo](frame-demo.mp4) is a silent, edited capture of the real phone-sized web preview at 4 fps. It does not demonstrate every proposed step below; in particular, airplane-mode and native-device checks were not completed. See [VALIDATION.md](VALIDATION.md) for the actual verification record.

For a future recording, use real API responses, a readable phone size, and clear interactions. Keep narration brief.

## Before recording

1. Start from a working install and choose the provider. The default animated-film catalog needs no key; a TMDB build uses its broader movie catalog.
2. Verify that popular movies and one search return results. Pick a title that is present in the selected provider, such as `Spirited Away` for the default catalog.
3. Save at least one movie, open its details, and let the cache persist. Leave another unsaved movie available to demonstrate saving.
4. Use a device or emulator where you can turn network access off and back on visibly. A web browser recording is acceptable as a preview if labeled as such, but do not call it a native-device test.
5. Hide notifications and credentials. Prepare the recording destination and confirm the microphone, if narrating, is audible.

## Recording sequence

| Time | Show | Suggested narration |
| --- | --- | --- |
| 0:00–0:12 | Open Discover; show the Frame title, provider label, and popular movies | “Frame is a React Native movie explorer. This demo uses the live animated-film catalog, with optional TMDB support.” Adapt the last sentence if using TMDB. |
| 0:12–0:30 | Scroll through enough cards to load another page, then return to the top and pull to refresh | “Popular films load as I scroll. Refresh keeps the current content available.” |
| 0:30–0:48 | Open Search and type the chosen title; briefly correct the input before pausing | “Search waits for typing to settle. Each query keeps its own results, so a slower previous request cannot replace the current search.” |
| 0:48–1:06 | Open a result; show poster, rating, and overview; save it | “The detail screen has the film's rating and story. Saving updates my collection immediately.” |
| 1:06–1:20 | Open Favourites; show the new title; open it again | “Favourites are stored on this device and work independently of the network cache.” |
| 1:20–1:43 | Disable connectivity, return to loaded Discover, attempt refresh, then open the saved title | “When the connection drops, loaded movies stay visible and the app explains the problem. My saved titles remain available.” |
| 1:43–1:55 | Fully close and relaunch while offline; show Favourites | “Saved movies survive a restart. Previously cached metadata can also be restored.” |
| 1:55–2:00 | Restore connectivity and end on a populated screen | “The app recovers when connectivity returns.” |

If the device takes longer to relaunch, shorten the initial browsing segment instead of speeding up taps until they become unreadable. If any step fails, keep the failure documented and fix it before presenting the recording as a successful demo.

## Submission note

Alongside the GitHub URL, include the actual recording file or a viewable link and a one-line context statement:

> Recorded on [device/platform], using [Tenrai animated-film catalog / TMDB], from [commit/build]. Demonstrates pagination, refresh, search, details, favourites, and offline recovery.

Replace every bracketed item with the actual information. Confirm a reviewer can open the link without requesting access. A screen recording is an alternative to an APK/Expo link under the task's submission requirements; a screenshot alone is not.
