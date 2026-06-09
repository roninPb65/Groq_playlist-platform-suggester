import type { ResolvedTrack, SongSuggestion } from "./types";

const API = "https://api.spotify.com/v1";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

// In-memory cache (resets on restart, which is fine on a single instance).
let cachedToken: { value: string; expiresAt: number } | null = null;
let cachedUserId: string | null = null;

// Get an access token for the OWNER account using the stored refresh token.
// Every playlist is created on this one account, so visitors never log in.
export async function getOwnerAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Spotify owner credentials are not configured. Visit /api/spotify/setup once to generate SPOTIFY_REFRESH_TOKEN.",
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Could not refresh the Spotify owner token (${res.status}). ${detail.slice(0, 150)}`);
  }

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

// spotifyFetch with exponential backoff on 429 (rate limit).
// Reads the Retry-After header and waits that many seconds before retrying,
// falling back to doubling delays (1s, 2s, 4s) if the header is absent.
// Other non-OK responses are thrown immediately with the full error body.
async function spotifyFetch(token: string, path: string, init?: RequestInit, _attempt = 0): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") ?? "", 10);
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : Math.min(1000 * 2 ** _attempt, 30_000); // cap at 30 s
    if (_attempt >= 4) {
      throw new Error(`Spotify rate limit exceeded on ${path}. Try again in ${Math.ceil(waitMs / 1000)}s.`);
    }
    await new Promise((r) => setTimeout(r, waitMs));
    return spotifyFetch(token, path, init, _attempt + 1);
  }

  if (!res.ok) {
    // Read the full body — Spotify error messages are often truncated at 200 chars
    // in logs but contain the actionable detail (e.g. "Token expired", "Insufficient scope").
    const detail = await res.text().catch(() => "");
    throw new Error(`Spotify ${res.status} on ${path}: ${detail}`);
  }

  return res.status === 204 ? null : res.json();
}

export async function getOwnerUserId(token: string): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const me = await spotifyFetch(token, "/me");
  cachedUserId = me.id;
  return me.id;
}

async function resolveOne(token: string, s: SongSuggestion, market?: string): Promise<ResolvedTrack> {
  const q = `track:"${s.title}" artist:"${s.artist}"`;
  const params = new URLSearchParams({ q, type: "track", limit: "1" });
  if (market) params.set("market", market);

  try {
    const data = await spotifyFetch(token, `/search?${params.toString()}`);
    const item = data?.tracks?.items?.[0];
    if (!item) return { suggested: s, matched: false };

    return {
      suggested: s,
      matched: true,
      uri: item.uri,
      spotifyUrl: item.external_urls?.spotify,
      name: item.name,
      artist: item.artists?.map((a: any) => a.name).join(", "),
      albumImage: item.album?.images?.[item.album.images.length - 1]?.url,
      releaseYear: parseYear(item.album?.release_date),
    };
  } catch (err) {
    // Re-throw auth and rate-limit errors — these affect all tracks and the
    // caller needs to know. Only swallow genuine "not found" (no results).
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("401") || msg.includes("403") || msg.includes("429") || msg.includes("rate limit")) {
      throw err;
    }
    return { suggested: s, matched: false };
  }
}

export async function resolveTracks(
  token: string,
  suggestions: SongSuggestion[],
  market?: string,
): Promise<ResolvedTrack[]> {
  const results: ResolvedTrack[] = [];
  const concurrency = 5;
  for (let i = 0; i < suggestions.length; i += concurrency) {
    const batch = suggestions.slice(i, i + concurrency);
    const resolved = await Promise.all(batch.map((s) => resolveOne(token, s, market)));
    results.push(...resolved);
  }
  return results;
}

// Create a PUBLIC playlist so anyone with the link / QR can open it.
// Uses /me/playlists (not /users/{id}/playlists) — the latter returns 403
// for most apps. /me/playlists infers the owner from the access token.
export async function createPublicPlaylist(
  token: string,
  _userId: string,  // kept for call-site compatibility; not used in path
  name: string,
  description: string,
): Promise<{ id: string; url: string }> {
  const playlist = await spotifyFetch(token, `/me/playlists`, {
    method: "POST",
    body: JSON.stringify({ name, description, public: true }),
  });
  return { id: playlist.id, url: playlist.external_urls?.spotify };
}

export async function addTracks(token: string, playlistId: string, uris: string[]): Promise<void> {
  for (let i = 0; i < uris.length; i += 100) {
    const chunk = uris.slice(i, i + 100);
    await spotifyFetch(token, `/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify({ uris: chunk }),
    });
  }
}

function parseYear(releaseDate?: string): number | undefined {
  if (!releaseDate) return undefined;
  const y = parseInt(releaseDate.slice(0, 4), 10);
  return Number.isFinite(y) ? y : undefined;
}
