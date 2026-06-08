import type { ResolvedTrack, SongSuggestion } from "./types";

const API = "https://api.spotify.com/v1";

async function spotifyFetch(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Spotify ${res.status} on ${path}: ${detail.slice(0, 200)}`);
  }
  return res.status === 204 ? null : res.json();
}

export async function getCurrentUser(token: string): Promise<{ id: string; display_name: string }> {
  const me = await spotifyFetch(token, "/me");
  return { id: me.id, display_name: me.display_name };
}

// Resolve one suggestion to a real Spotify track.
async function resolveOne(
  token: string,
  s: SongSuggestion,
  market?: string,
): Promise<ResolvedTrack> {
  const q = `track:"${s.title}" artist:"${s.artist}"`;
  const params = new URLSearchParams({ q, type: "track", limit: "1" });
  if (market) params.set("market", market);

  try {
    const data = await spotifyFetch(token, `/search?${params.toString()}`);
    const item = data?.tracks?.items?.[0];
    if (!item) return { suggested: s, matched: false };

    const releaseYear = parseYear(item.album?.release_date);
    return {
      suggested: s,
      matched: true,
      uri: item.uri,
      spotifyUrl: item.external_urls?.spotify,
      name: item.name,
      artist: item.artists?.map((a: any) => a.name).join(", "),
      albumImage: item.album?.images?.[item.album.images.length - 1]?.url,
      releaseYear,
    };
  } catch {
    return { suggested: s, matched: false };
  }
}

// Resolve all suggestions with limited concurrency so we don't trip rate limits.
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

export async function createPlaylist(
  token: string,
  userId: string,
  name: string,
  description: string,
): Promise<{ id: string; url: string }> {
  const playlist = await spotifyFetch(token, `/users/${userId}/playlists`, {
    method: "POST",
    body: JSON.stringify({ name, description, public: false }),
  });
  return { id: playlist.id, url: playlist.external_urls?.spotify };
}

export async function addTracks(token: string, playlistId: string, uris: string[]): Promise<void> {
  // Spotify accepts up to 100 URIs per request.
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
