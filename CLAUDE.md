# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A real-time web app for running MATHCOUNTS-style Countdown rounds at [WAMO](https://wamomath.org/). Two competitors face off head-to-head, buzzing in to answer math problems under a timed countdown. An admin controls the match flow.

## Running the App

```bash
npm install
node src/index.js
```

Server starts on port 8000. No build step — static files are served directly from `src/`.

There are no tests or linters configured.

## Architecture

### Server (`src/index.js`)

Express 5 + Socket.IO server. All room state lives in a server-side `ROOMS` object (in-memory, not persisted). The server acts as a relay — it receives socket events, updates `ROOMS`, and broadcasts state changes to clients. Routes serve static HTML pages and a `/sync` endpoint for clock synchronization.

### Client Pages

Each HTML page loads its own CSS from `src/styles/` and JS from `src/scripts/`:

- **Lander** (`/`) — Join form where players enter name, room, and key
- **Play** (`/play`) — Player view with question display, timer progress bar, and buzzer (spacebar)
- **Admin** (`/admin`) — Admin dashboard to control slides, timer, competitors, scores, and approve/deny players
- **Creator** (`/creator`) — Question editor with live BBCode + LaTeX preview
- **Converter** (`/converter`) — Utility page

### Game/Property Framework (`src/scripts/objects.js`)

The client uses a reactive OOP pattern for state synchronization:

- **`Game`** — Base class holding room name and socket reference. Emits `roomStateUpdate` events to sync state with server. `CountdownGame` (defined separately in admin.js and play.js) extends this with specific properties.
- **`Property`** — Each piece of room state (questions, timing, scores, buzzed, etc.) is a `Property` instance with `update()` (push to server), `updateExternal()` (receive from server), and `render()` (update DOM).
- **`AdminProperty`** — Variant that emits `adminRoomStateUpdate` (only broadcast to admin sockets).

Admin and player each define their own `CountdownGame` subclass with page-specific `Property` subclasses that override `renderInternal()` for their respective DOM updates.

### Client Dependencies

Loaded via ESM from `esm.sh` CDN (no bundler):
- `@bbob/*` for BBCode rendering
- `hacktimer` (play.js only) for reliable `setTimeout`/`setInterval` in background tabs
- KaTeX (loaded in HTML) for LaTeX math rendering

### Time Synchronization (`src/scripts/utils.js`)

Clients calculate a clock `OFFSET` against the server at connect time via the `/sync` endpoint. All timer operations use `getSyncedServerTime()` (= `Date.now() + OFFSET`) so countdown timers stay consistent across devices.

### Buzzer System

Competitors press spacebar to buzz. Buzzing pauses the timer and records who buzzed first (`lastBuzzer`). The admin then marks the answer correct (awards point, stops timer) or incorrect (resumes timer for the other player). Best-of-3 scoring (scores go up to 3).

### Questions Format

Questions are JSON arrays: `[{statement: string, timeMS: number}, ...]`. The `statement` field supports BBCode markup and LaTeX math (`$...$` and `$$...$$`). `timeMS: 0` means no countdown (used for title/answer slides).

## Conventions

- Do not add Claude or AI branding/attribution anywhere — not in commits, PRs, code comments, or generated content.
