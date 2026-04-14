# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (scan QR code with Expo Go)
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
```

No test or lint scripts are configured. EAS builds:
```bash
eas build --profile preview    # Internal distribution build
eas build --profile production # Production build
```

## Environment

Requires a `.env` file (see `.env.example`):
```
ANTHROPIC_API_KEY=your_key_here
```

## Architecture

Expo React Native app (SDK 54) for Italy travel assistance. Five bottom tabs, each a self-contained screen. No global state management — screens use `useState` locally and delegate AI work to `claudeApi.js`.

**Tab screens** ([src/screens/](src/screens/)):
- `TranslationScreen` — text translation (EN↔IT, ZH↔IT) + camera OCR
- `DiscoverScreen` — pre-loaded destination guides + camera-based artwork/landmark ID
- `MapScreen` — real-time ZTL (restricted traffic zone) warnings via GPS + polygon overlays
- `EssentialsScreen` — phrasebook (EN/IT/ZH) + EUR currency converter
- `NotesScreen` — SQLite-backed notes and to-do lists with Expo notifications for reminders

**Services** ([src/services/](src/services/)):
- `claudeApi.js` — all calls to Anthropic Claude API (`claude-sonnet-4-6`). Takes text or base64 image + destination context. This is the only file that touches the API.
- `destinationContext.js` — in-memory singleton (`let _current = null`) storing the user's selected destination. Used to enrich Claude prompts with `"The visitor is currently in [name], [region], Italy"`.
- `notesDb.js` — SQLite wrapper (`expo-sqlite`). Single `notes` table with `type` ('note'|'todo'), `title`, `body`, `items` (JSON checklist), `reminder_time` (unix ms), `notification_id`.

**Static data** ([src/data/](src/data/)):
- `destinations.js` — Rome, Florence, Tuscany guide objects
- `phrases.js` — phrasebook entries with EN/IT/ZH translations
- `ztlZones.js` — GPS polygon boundaries for ZTL restricted zones

## Key Patterns

**Claude API calls** always include destination context from `destinationContext.getDestination()` injected into the system prompt. Image requests encode the photo as base64 and pass it as a `image_url` content block.

**Currency rates** are fetched from `https://open.er-api.com/v6/latest/EUR` via axios (no auth needed).

**Navigation** uses React Navigation v6 bottom tabs. The tab navigator is configured in [App.js](App.js) with a dark theme (`#1a1a2e` background, `#e94560` active tint).

**Notifications** (reminders in Notes) use `expo-notifications`. Permissions must be granted at runtime; the app requests them when the user first sets a reminder.

## Pending: Background Location Tracking

Both the ZTL warning (MapScreen) and activity tracking (ActivityScreen) currently use `Location.watchPositionAsync`, which is **foreground-only** to stay Expo Go compatible. This means:
- ZTL warnings only fire when the app is foregrounded AND the Map tab has been visited at least once
- Activity tracker's GPS path has gaps whenever the app is backgrounded (steps on iOS still come through HealthKit)

When ready to do a dev build, unify both into a single background location task:
1. Install `expo-task-manager`
2. Add `UIBackgroundModes: ["location"]` to `app.json` iOS config
3. Use `Location.startLocationUpdatesAsync` with a registered `TaskManager.defineTask`
4. In the task handler, route each location update to both handlers: ZTL zone check (fire local notification on entry) + activity tracker path append
5. Switch from Expo Go to a dev build (`eas build --profile development`)

This is more efficient than running two separate GPS subscriptions and enables real-time ZTL warnings even when the app is in the background.
