---
name: Frame
description: "A personal cinematheque for discovering and collecting movies and series."
colors:
  dark-background: "#111512"
  dark-surface: "#1B211C"
  dark-raised: "#242C25"
  dark-text: "#F5F3E9"
  dark-muted: "#A6B0A4"
  dark-subtle: "#899685"
  dark-border: "#333D33"
  dark-accent: "#D5ED86"
  dark-on-accent: "#18220C"
  dark-error: "#FFB4A6"
  dark-warning: "#EBC888"
  dark-selection: "#26331C"
  dark-selection-border: "#5A7139"
  light-background: "#F6F4EC"
  light-surface: "#ECEFE3"
  light-raised: "#E3E8D9"
  light-text: "#182217"
  light-muted: "#53614F"
  light-subtle: "#56664F"
  light-border: "#CED5C5"
  light-accent: "#365A20"
  light-on-accent: "#FFFFFF"
  light-error: "#A32C24"
  light-warning: "#7A5614"
  light-selection: "#DFEACD"
  light-selection-border: "#789163"
  poster-save-scrim: "rgba(17,21,18,0.88)"
  poster-rating-scrim: "rgba(17,21,18,0.94)"
typography:
  display:
    fontFamily: "InstrumentSerif_400Regular"
    fontSize: "44px"
    fontWeight: 400
    lineHeight: "48px"
  headline:
    fontFamily: "InstrumentSerif_400Regular"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: "34px"
  body:
    fontFamily: "DMSans_400Regular"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "22px"
  card-title:
    fontFamily: "DMSans_600SemiBold"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
  button-label:
    fontFamily: "DMSans_700Bold"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: "22px"
  option-label:
    fontFamily: "DMSans_500Medium"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "22px"
  caption:
    fontFamily: "DMSans_400Regular"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "19px"
rounded:
  field: "10px"
  card: "12px"
  pill: "24px"
  library-tab: "25px"
  button: "28px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "24": "24px"
  "32": "32px"
  "48": "48px"
components:
  button-primary-dark:
    backgroundColor: "{colors.dark-accent}"
    textColor: "{colors.dark-on-accent}"
    typography: "{typography.button-label}"
    rounded: "{rounded.button}"
    padding: "13px 22px"
  button-secondary-dark:
    backgroundColor: "{colors.dark-raised}"
    textColor: "{colors.dark-text}"
    typography: "{typography.button-label}"
    rounded: "{rounded.button}"
    padding: "13px 22px"
  collection-input-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  appearance-option-dark:
    backgroundColor: "{colors.dark-raised}"
    textColor: "{colors.dark-text}"
    typography: "{typography.option-label}"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
  appearance-option-selected-dark:
    backgroundColor: "{colors.dark-accent}"
    textColor: "{colors.dark-on-accent}"
    typography: "{typography.option-label}"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
  poster-card-dark:
    backgroundColor: "{colors.dark-raised}"
    rounded: "{rounded.card}"
  button-primary-light:
    backgroundColor: "{colors.light-accent}"
    textColor: "{colors.light-on-accent}"
    typography: "{typography.button-label}"
    rounded: "{rounded.button}"
    padding: "13px 22px"
  button-secondary-light:
    backgroundColor: "{colors.light-raised}"
    textColor: "{colors.light-text}"
    typography: "{typography.button-label}"
    rounded: "{rounded.button}"
    padding: "13px 22px"
  collection-input-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  appearance-option-light:
    backgroundColor: "{colors.light-raised}"
    textColor: "{colors.light-text}"
    typography: "{typography.option-label}"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
  appearance-option-selected-light:
    backgroundColor: "{colors.light-accent}"
    textColor: "{colors.light-on-accent}"
    typography: "{typography.option-label}"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
  poster-card-light:
    backgroundColor: "{colors.light-raised}"
    rounded: "{rounded.card}"
---

# Design System: Frame

## Overview

**Creative North Star: "A cinematheque’s programme"**

Frame borrows the quiet confidence of a cinematheque’s programme: warm paper-colored text, ink-dark surfaces for evening browsing, generous editorial type and untinted film artwork. Light appearance carries that same identity onto warm paper, pale green surfaces and forest-green actions. Lime remains the dark appearance’s signal for selection and meaningful actions.

The product is a browsing tool, so navigation and feedback stay predictable. Real posters lead; editorial headings introduce the collection, while DM Sans keeps controls, metadata, ratings and personal lists easy to scan. Collections and statistics extend the same visual language through simple rows, rules and restrained accent marks.

**Key Characteristics:**
- Editorial serif headings with practical sans-serif controls.
- Paired dark and light palettes with the same semantic color roles.
- Real, untinted artwork with consistently dark poster overlays.
- Rounded controls, flat surfaces and clear selection states.
- Phone-first touch targets with responsive wider layouts.

The frontmatter records the implemented tokens. React Native dimensions are logical units; the portable token representation and sidecar previews use `px` with the same numeric values. The palettes and loaded font names come from `src/theme-tokens.ts`. Component roles are extracted from the current native styles, not a separate web design system.

## Colors

Warm neutrals and green accents preserve one identity across evening and daylight browsing. Both palettes have the same semantic keys; `dark-` and `light-` name their appearances in the frontmatter.

### Primary

- **Dark lime** (`dark-accent` / `dark-on-accent`): primary actions, selected controls, personal stars and saved-state marks.
- **Light forest** (`light-accent` / `light-on-accent`): the same actions and selections on warm paper, with white labels.
- **Selection tones** (`*-selection` / `*-selection-border`): quieter active navigation and filter states.

### Neutral

- **Ink canvas / warm paper** (`*-background`): the screen and navigation foundation.
- **Surface / raised** (`*-surface` / `*-raised`): grouped options, fields, placeholders and contained controls; they do not imply a shadow.
- **Primary / muted / subtle ink** (`*-text`, `*-muted`, `*-subtle`): content, supporting metadata, and placeholders respectively.
- **Rules** (`*-border`): field outlines, list dividers and navigation edges.
- **Poster scrims** (`poster-save-scrim`, `poster-rating-scrim`): save controls and numeric scores remain dark over artwork in both appearances. Their labels use the dark palette’s text and accent colors.
- **Error / warning** (`*-error` / `*-warning`): form errors and recoverable inline notices.

**The Artwork Rule.** Keep poster artwork untinted and preserve dark scrims with light text and lime marks across both appearances.

Appearance options are System, Light and Dark. The saved preference survives relaunch; System follows the device scheme, and a new installation defaults to Dark. Theme changes update the current UI, navigation colors and status bar without replacing navigation state.

## Typography

Instrument Serif supplies editorial screen and section headings. DM Sans supplies body text, labels and metadata, with regular, medium, semibold and bold faces loaded under the native names recorded in the frontmatter.

The reusable hierarchy is `display` for primary screen titles, `headline` for appearance/library section headings, `body` for ordinary content, `card-title` for poster captions, `button-label` for main actions, `option-label` for appearance choices, and `caption` for supporting metadata. These are observed roles rather than a forced type ratio; individual hero and detail headings adapt at their own wider-layout thresholds.

**The Reading Rule.** Keep serif type for editorial hierarchy and sans-serif type for actions, ratings, counts and supporting information.

## Layout

The app is phone-first. Browsing uses a virtualized poster grid with a content maximum of 1180 and horizontal gutters of 24. Card gaps are 16. After allowing for the navigation rail, the grid uses two columns below 620 content width, three from 620, and four from 900. Library content is capped at 1000 with the same gutters.

Tabs sit below the content on phones. At a window width of 1000, they move to a left rail 216 wide. Feature presentation and watchlist rows change at 700; detail content changes at 760. These thresholds are component-specific, not a single global responsive breakpoint. Safe areas remain part of every screen’s layout.

The existing spacing rhythm is retained in the frontmatter. New controls provide at least 48 logical units of target area; main buttons and library tabs have a minimum height of 50, and collection fields have a minimum height of 52. Appearance options wrap when necessary. Library tabs share the available width, and compact metadata yields space to titles.

## Elevation & Depth

The system is flat. Canvas, surface and raised tones establish grouping without decorative shadows or native elevation. Fine rules separate rows. Poster scrims establish local contrast over images rather than simulating floating panels.

Common action buttons press to scale 0.97 over 90 ms and return over 180 ms using cubic-out easing. Image reveals use 160 ms for poster cards and 200 ms for the featured image. Reduced motion disables this scaling, image transitions and stack navigation animation; press opacity still provides immediate feedback. Native interaction and focus behavior remain intact. The sidecar records the implemented motion values and component-specific thresholds.

## Shapes

Portrait artwork is clipped to a two-to-three proportion with the `card` radius. Collection fields and inline notices use the smaller `field` curve. Appearance choices, catalog choices and language filters use pill silhouettes; main buttons and library tabs retain their own observed radii. Library list thumbnails use a smaller curve, and list rows use separators rather than enclosing every item in a card.

## Components

### Buttons

Primary actions pair the active accent with its `onAccent` label. Secondary buttons use the raised tone and primary text. Both use bold DM Sans, the `button` radius and the frontmatter’s padding. Icon buttons have a circular 48-by-48 target. Press opacity for shared buttons is 0.72; disabled opacity is 0.45. Loading actions expose a busy state and replace the icon with an activity indicator.

### Catalog and appearance choices

Movies/Series is a segmented control on a surface-colored container, with accent-filled selection and a minimum target height of 48. Original-language filters are outlined pills; a selected language uses primary text, raised fill and a primary-text border. The available catalog is identified beside these controls.

Appearance choices use raised pills, medium-weight labels and accent-filled selection. They expose radio states, are disabled until the preference has loaded, and place save failures in an inline notice with Retry.

### Inputs / Fields

Collection creation and renaming share a surface fill, border-colored outline, `field` curve, body text and muted placeholder. Search and account fields retain their existing larger shapes and accent border when focused. Do not silently transfer a screen-specific field shape to every input. Errors use the active error color and remain close to the relevant field.

### Cards / Containers

Poster cards preserve the original image, reserve an overlaid catalog-score badge and provide a separate save target. Their captions show a title, metadata and optional watched/watchlist state. Missing artwork leaves a readable placeholder. Collection and personal-rating lists use compact poster thumbnails, titles, secondary metadata and fine dividers.

### Navigation

Discover, Search, Watchlist, Favourites and Library share one tab system. Active labels and icons use the accent; inactive content uses muted ink. The active icon gets the selection tone, and the wide rail adds a surface-filled active row. Library’s Collections, Your ratings and Stats choices use equally sized filled tabs.

### Personal ratings and cinema statistics

Personal rating is a five-star choice with separate 48-by-48 targets, selected stars in the current accent and an explicit numeric value. Catalog ratings retain their independent out-of-ten scale. Collection membership uses checkbox state and an expandable list with a named input.

Statistics use aligned label/value rows with rules; values use the accent and semibold text. Genre counts sit above slim raised tracks with accent fills. Bars are proportional to the largest actual genre count. Empty states explain how to populate the view without manufacturing values.

### Feedback

Offline and storage feedback is inline whenever usable content exists. Notices use raised tones, readable text and a separate action target, including Undo. Fullscreen error states are reserved for the absence of usable content. Accessible names, native back behavior, text scaling and selected/disabled states remain part of each component’s contract.

## Do's and Don'ts

### Do:
- **Do** use the active palette through `useTheme()` and `useThemedStyles()` for new UI.
- **Do** keep the dark poster overlay, light text and lime save/rating marks in both appearances.
- **Do** keep action targets at least 48 logical units and retain native labels, selected states and text scaling.
- **Do** preserve loaded cards during refresh and place retry feedback beside the failed operation.
- **Do** distinguish catalog scores out of 10 from personal ratings out of 5.
- **Do** derive collection counts and cinema statistics from the actual saved data.

### Don't:
- **Don’t** tint or recolor the film artwork to match either appearance.
- **Don’t** introduce decorative shadows into the existing flat surface system.
- **Don’t** animate press scaling, image transitions or stack navigation when reduced motion is enabled.
- **Don’t** invent ratings, availability, season groups, cast, or account capabilities.
- **Don’t** make appearance changes reset the current navigation or saved personal library.
