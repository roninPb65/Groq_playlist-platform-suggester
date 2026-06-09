import type { ResolvedTrack, SongSuggestion } from "./types";

const API = "https://api.spotify.com/v1";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

// ---------------------------------------------------------------------------
// Token cache
// ---------------------------------------------------------------------------
let cachedToken: { value: string; expiresAt: number } | null = null;
let cachedUserId: string | null = null;

// ---------------------------------------------------------------------------
// Get owner access token (refresh token flow)
// ---------------------------------------------------------------------------
export async function getOwnerAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Spotify owner credentials are not configured. Visit /api/spotify/setup once to generate SPOTIFY_REFRESH_TOKEN."
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
    throw new Error(
      `Could not refresh Spotify token (${res.status}). ${detail.slice(0, 150)}`
    );
  }

  const data = await res.json();

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.value;
}

// ---------------------------------------------------------------------------
// Spotify fetch with retry (429 handling)
// ---------------------------------------------------------------------------
async function spotifyFetch(
  token: string,
  path: string,
  init?: RequestInit,
  _attempt = 0
): Promise<any> {
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

    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(1000 * 2 ** _attempt, 30_000);

    if (_attempt >= 4) {
      throw new Error(
        `Spotify rate limit exceeded on ${path}. Try again later.`
      );
    }

    await new Promise((r) => setTimeout(r, waitMs));
    return spotifyFetch(token, path, init, _attempt + 1);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Spotify ${res.status} on ${path}: ${detail}`);
  }

  return res.status === 204 ? null : res.json();
}

// ---------------------------------------------------------------------------
// User ID
// ---------------------------------------------------------------------------
export async function getOwnerUserId(token: string): Promise<string> {
  if (cachedUserId) return cachedUserId;

  const me = await spotifyFetch(token, "/me");
  cachedUserId = me.id;

  return me.id;
}

// ---------------------------------------------------------------------------
// Track resolution
// ---------------------------------------------------------------------------
async function resolveOne(
  token: string,
  s: SongSuggestion,
  market?: string
): Promise<ResolvedTrack> {
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
    return { suggested: s, matched: false };
  }
}

export async function resolveTracks(
  token: string,
  suggestions: SongSuggestion[],
  market?: string
): Promise<ResolvedTrack[]> {
  const results: ResolvedTrack[] = [];
  const concurrency = 5;

  for (let i = 0; i < suggestions.length; i += concurrency) {
    const batch = suggestions.slice(i, i + concurrency);
    const resolved = await Promise.all(
      batch.map((s) => resolveOne(token, s, market))
    );
    results.push(...resolved);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Playlist creation
// ---------------------------------------------------------------------------
export async function createPublicPlaylist(
  token: string,
  _userId: string,
  name: string,
  description: string
): Promise<{ id: string; url: string }> {
  const playlist = await spotifyFetch(token, `/me/playlists`, {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      public: true,
    }),
  });

  return {
    id: playlist.id,
    url: playlist.external_urls?.spotify,
  };
}

// ---------------------------------------------------------------------------
// Add tracks
// ---------------------------------------------------------------------------
export async function addTracks(
  token: string,
  playlistId: string,
  uris: string[]
): Promise<void> {
  for (let i = 0; i < uris.length; i += 100) {
    const chunk = uris.slice(i, i + 100);

    await spotifyFetch(token, `/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify({ uris: chunk }),
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseYear(releaseDate?: string): number | undefined {
  if (!releaseDate) return undefined;

  const y = parseInt(releaseDate.slice(0, 4), 10);
  return Number.isFinite(y) ? y : undefined;
}
