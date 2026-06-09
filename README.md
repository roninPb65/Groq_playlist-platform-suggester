# Resonance

An AI playlist platform that reconstructs the soundtrack of your life — from where you
lived and when — and gives you a **shareable, scannable** playlist.

How it works in this build:

- **Reasoning:** Groq (Llama 3.3) turns each visitor's answers into a confidence-tagged song list.
- **One account, no visitor login:** every playlist is created on a single owner Spotify account
  (yours) and made public. Visitors never log into Spotify.
- **Sharing:** the result page shows a link and a **QR code**. Anyone can scan it, open the
  playlist in their own Spotify, and save it if they like it.
- **Bring-your-own-key:** each visitor supplies their own Groq key in the UI. It stays in the
  browser tab and is sent only with that request — never stored on the server.

This sidesteps Spotify's Development Mode user limit, because only the owner account ever writes;
listeners just open a public link.

> Grounding (news/charts retrieval) and Last.fm similarity are included as ready-to-wire modules.

---

## 1. Prerequisites

- Node.js 18.18+ (Node 20 recommended)
- A Spotify developer app: https://developer.spotify.com/dashboard
- A free Groq key for testing: https://console.groq.com/keys

## 2. Spotify app setup

Create an app in the Spotify dashboard and copy the **Client ID** and **Client Secret**.
Add this **Redirect URI** (used once, to fetch the owner refresh token):

- Production: `https://YOUR-APP.onrender.com/api/spotify/setup`
- Local: `http://127.0.0.1:3000/api/spotify/setup`

Add the owner account under **User Management** (dev mode allows a few users; the owner needs to
be allowed to create playlists).

## 3. Environment variables

| Variable | What it is |
| --- | --- |
| `APP_URL` | Your public URL, e.g. `https://YOUR-APP.onrender.com` (no trailing slash) |
| `SPOTIFY_CLIENT_ID` | From the Spotify dashboard |
| `SPOTIFY_CLIENT_SECRET` | From the Spotify dashboard |
| `SPOTIFY_REFRESH_TOKEN` | Obtained via the one-time setup below (leave blank at first) |
| `LASTFM_API_KEY` | Optional |

There is **no** Groq key and **no** Auth.js secret — those are gone in this model.

## 4. One-time: get the owner refresh token

1. Deploy (or run locally) with `APP_URL`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` set.
2. Visit `{APP_URL}/api/spotify/setup` while logged into Spotify as the account that should own
   the playlists. Approve the permissions.
3. It shows a **refresh token**. Copy it into `SPOTIFY_REFRESH_TOKEN` (Render env + your local
   `.env.local`) and redeploy.
4. Optional but recommended: delete `src/app/api/spotify/setup/route.ts` afterward.

## 5. Local development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://127.0.0.1:3000
```

Use `127.0.0.1`, not `localhost` — Spotify requires the loopback IP for http redirect URIs.

## 6. Deploy on Render via GitHub

1. Push to GitHub.
2. Render → **New → Web Service**, connect the repo. It reads `render.yaml`, or set manually:
   Runtime **Node**, Build `npm ci && npm run build`, Start `npm start`.
3. Set the environment variables from section 3 (Free instance type).
4. Do the one-time setup (section 4), then redeploy with `SPOTIFY_REFRESH_TOKEN` in place.

**Free-tier note:** the service spins down after ~15 min idle; the first request after a lull
takes ~50s to wake.

## 7. Key files

- `src/lib/prompt.ts` — curation prompt (reminiscence weighting, diversity, anti-hallucination)
- `src/lib/groq.ts` — calls the visitor's key, JSON mode, defensive parsing
- `src/lib/spotify.ts` — owner-token auth, search/resolve, **public** playlist creation
- `src/app/api/generate/route.ts` — orchestration + QR generation
- `src/app/api/spotify/setup/route.ts` — one-time owner token bootstrap (deletable after)

## 8. Extending

- **Grounding (`src/lib/grounding.ts`):** wire a web-search or charts source; the string it
  returns is passed to Groq as authoritative context. Biggest accuracy lever for non-Western scenes.
- **Similarity (`src/lib/lastfm.ts`):** Last.fm `track.getSimilar` substitutes for Spotify's removed
  recommendations. Set `LASTFM_API_KEY` and expand the list before resolving.
- **"Save to my own Spotify" (optional):** if you later want visitors to save to their own account,
  add a per-visitor OAuth path alongside this one — but you'll re-enter Spotify's dev-mode limits
  until you get Extended Quota approval.

## 9. Security notes

- No API keys in the repo. Owner secrets live in Render env vars; the Groq key is per-visitor input.
- The visitor's Groq key is never logged or persisted server-side.
- The owner refresh token is powerful — keep it only in env vars, never in the repo or logs.
- `.env*` files are gitignored.

---

*Technical details reflect platform behavior as of early 2026. Verify Spotify, Groq, and Last.fm
API terms against their live docs before relying on them.*
