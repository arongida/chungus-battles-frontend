# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server with hot module replacement
ng serve --hmr

# Build for production
ng build

# Run tests (Karma/Jasmine)
ng test

# Run a single test file
ng test --include='**/path/to/file.spec.ts'

# Deploy to GitHub Pages
ng deploy
```

The app requires the game server running at `ws://localhost:2567` (configured in `src/environments/environment.development.ts`).

## Architecture

This is an **Angular 18 standalone-component** app for a turn-based auto-battler game. It uses **Colyseus.js** as the real-time WebSocket client to communicate with the game server.

### Game Flow

```
/ (JoinFormComponent)
  → /draft/:id (DraftRoomComponent)  — draft phase: buy items, pick talents
  → /fight/:id (FightRoomComponent)  — battle phase: watch automated combat
  → /end         (EndComponent)      — end screen with win/loss
```

The `draftGuard` protects `/draft` and `/fight` routes by checking for a `reconnectToken` in `localStorage`.

### Key Services

- **`DraftService`** (`draft/services/`) — Colyseus client for `draft_room`. Handles `joinOrCreate`, `reconnect`, `sendMessage`, and `leave`. Persists `sessionId`, `playerId`, `roomId`, and `reconnectToken` to `localStorage`.
- **`FightService`** (`fight/services/`) — Colyseus client for `fight_room`. Room is held in an Angular `signal`.
- **`SoundsService`** (`common/services/`) — Manages background music and sound effects. Uses CDN-hosted audio assets.
- **`CharacterDetailsService`** / **`ItemTrackingService`** — Shared services in `common/services/`.

### State Management

Server state arrives via Colyseus `@colyseus/schema` classes in `src/app/models/colyseus-schema/`. Components call `room.onStateChange()` and manually re-assign plain schema objects (using `new Player().assign(...)` or `Object.assign`) to trigger Angular change detection.

The `Player` schema is the central data model, holding stats, inventory, equipped items (`MapSchema<Item>` keyed by `EquipSlot`), talents, item collections, and more.

### Animations

`src/app/common/TriggerAnimations.ts` contains imperative DOM helpers that add/remove CSS classes by element ID to trigger battle animations (weapon attacks, avatar hit, talent/collection activations). Element IDs follow the pattern `equipped-slot-{slot}-{playerId}`, `avatar-{playerId}`, `talent-{talentId}-{playerId}`, `collection-{collectionId}-{playerId}`.

### Styling

Tailwind CSS utility classes plus Angular Material components (with global `appearance: 'outline'` for form fields). Component-specific styles are in `.scss` files alongside each component. SSR is configured via `@angular/ssr` but the app checks `isPlatformBrowser` / `isLocalStorageAvailable` guards throughout for SSR compatibility.
