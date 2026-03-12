# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Express + Vite middleware on port 3000)
npm run build     # Production build via Vite
npm run preview   # Preview production build
```

Requires `GEMINI_API_KEY` in `.env.local`.

## Architecture

**Seedance 2.0 Mastery** is an interactive learning platform for prompt engineering with the Seedance 2.0 AI video generator. It uses React + TypeScript on the frontend and an Express server with Socket.io for real-time features.

### Key Files

| File | Purpose |
|------|---------|
| `server.ts` | Express server, Vite dev middleware, Socket.io, `/api/posts` endpoint |
| `App.tsx` | Root component; owns `currentView` state for all navigation |
| `constants.ts` | All lesson content (markdown), prompt tags, and example prompts |
| `types.ts` | Shared TypeScript interfaces |
| `services/geminiService.ts` | All Google Gemini API calls |

### Routing

There is **no React Router** — navigation is a `currentView` string state in `App.tsx` switching between: `intro`, `camera`, `lighting`, `advanced`, `playground`, `forum`.

### State Management

Plain React `useState` throughout. No Redux/Zustand. Socket.io client handles real-time forum sync. `localStorage` persists forum user profile.

### Gemini API (`services/geminiService.ts`)

Five functions, each using a specific model:
- `analyzePrompt()` — scores prompt quality (JSON schema output), model: `gemini-3-flash-preview`
- `generatePreviewImage()` — returns base64 image, model: `gemini-2.5-flash-image`
- `enhancePrompt()` — expands vague ideas, supports `regular` and `multi-shot` modes, model: `gemini-3-pro-preview`
- `refinePromptForFilter()` — rewrites prompts to pass safety filters, multiple strategies, model: `gemini-3-flash-preview`
- `createDirectorChat()` — streaming chat with Hollywood cinematographer persona, model: `gemini-3-pro-preview`

### Real-time (Socket.io)

Server (`server.ts`) holds forum posts in-memory (no DB). Events: `new_post` → `post_added`, `like_post` → `post_updated`.

### Styling

Tailwind CSS loaded from CDN in `index.html` (not compiled). Custom teal/turquoise brand palette defined there too.

### Path Alias

`@` maps to the project root (configured in both `vite.config.ts` and `tsconfig.json`).
