# Two-minute Frame feature demo

This is a plan for a **new recording of the expanded app**. The existing [Frame video](frame-demo.mp4) is the original baseline: a silent, edited capture of the phone-sized web preview at 4 fps showing browsing, search, details, and favourites. It predates series, cast/episodes, personal ratings, collections, stats, and themes. Do not label it as evidence for this new sequence.

Completed checks and their limits belong in [VALIDATION.md](VALIDATION.md). A planned offline step is not evidence of an airplane-mode or native-device test.

## Prepare the app

1. Start a working install and record its commit/build, platform, and provider. The default Tenrai catalog supplies animated movies and anime series without a key. No TMDB token is included; to demonstrate Telugu/Hindi/English movies or TV, configure your own token locally and restart Metro first.
2. Use a readable phone-sized view. Check live Movies, Series, and one search. Choose a series with available cast and episodes; choose a different movie to rate during the recording. Let network requests settle before recording.
3. Prepare a small, honest local library: a watched movie, a watched series, and at least two personal ratings. Create a collection with a few titles so the Library and Stats screens have meaningful data. These are deliberate demo interactions, not fabricated watch history.
4. Keep one title unsaved for the live favourite action. Prepare a short collection name and a search term that returns a result. If showing comments, use a disposable demo identity and hide its email; never capture real personal details or environment files.
5. Decide how to demonstrate connectivity. Use a device or emulator with a visible network toggle, or a clearly labeled browser preview. Load the title to be opened offline and allow local storage to finish. Do not describe browser network controls as a native airplane-mode test.
6. Hide notifications and credentials. Start in Dark appearance so a later Light switch is visible. If narrating, check microphone volume; keep the text on screen legible rather than accelerating taps.

## Recording sequence

| Time      | Show                                                                                                     | Suggested narration                                                                                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0:00–0:12 | Discover, popular posters, pagination, then pull-to-refresh                                              | “Frame explores movies and series. New pages load as I scroll, and refresh keeps existing content available.”                                                                                                |
| 0:12–0:23 | Switch to Series; show the provider scope. With TMDB configured, briefly select one language             | Key-free: “This live catalog includes animated movies and anime series. TMDB adds world cinema and original-language filters.” With TMDB: “I can browse Telugu, Hindi, or English original-language titles.” |
| 0:23–0:34 | Search for the prepared title, pause after typing, and open it                                           | “Search is debounced, with separate results for each media type and language.”                                                                                                                               |
| 0:34–0:49 | Show poster/overview; save the title; open Cast & crew, then More like this                              | “Details include the story, cast and creators, plus related titles to explore.”                                                                                                                              |
| 0:49–1:03 | On the chosen series, open Episodes, expand one row, and use Next if available                           | “Series have episode information and season selection where provided. Anime seasons are separate catalog titles, and long lists show 20 episodes per page.”                                                  |
| 1:03–1:18 | Give a personal star rating; open Add to a collection and add the title to the prepared list             | “My own rating is out of five and marks the title watched. I can keep it in any of my custom collections.”                                                                                                   |
| 1:18–1:33 | Open Library; show the collection and its rename/remove controls, then Your ratings and Stats            | “The library saves my lists and ratings on this device. Stats come from my actual watched titles and personal scores.”                                                                                       |
| 1:33–1:43 | Open the person icon, find Appearance, switch to Light, then return                                      | “Light, dark, and system appearance are saved locally, with reduced-motion support.”                                                                                                                         |
| 1:43–2:00 | Disconnect visibly, open the prepared title from its collection or Favourites, then restore connectivity | “Saved metadata and personal actions stay usable offline. Unloaded information has clear recovery when the connection returns.”                                                                              |

If live requests need more time, trim the opening scroll and narration. Keep interactions readable and use a separate, honestly labeled extended clip for cold-launch persistence, comments, or additional failure recovery. Do not imply a step succeeded if it was cut from the recording. Fix observed failures and keep their verification record visible.

For a fresh recording without a TMDB token, show the real animated catalog and state that language filters require configuration. Do not present mock Telugu/Hindi/English posters, claim working playback, or describe the device-only profile as a server account.

## Submission note

Alongside the repository URL, include the new recording file or viewable link and a concise context statement:

> Recorded on [actual device/platform], using [Tenrai animated movies and series / configured TMDB], from [commit/build]. Demonstrates [only the features visible in this recording].

Replace the brackets with actual information. Confirm reviewers can open the link without requesting access. Label browser previews and any edits accurately. The task accepts a recording as an alternative to an APK/Expo link; screenshots alone do not replace that deliverable. Keep the existing `frame-demo.mp4` labeled **original baseline** until a new video is actually captured.
