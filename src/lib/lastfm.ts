// OPTIONAL similarity expansion via Last.fm.
//
// Spotify removed its Recommendations and Audio Features endpoints for new apps,
// so Last.fm's still-live `track.getSimilar` is a good grounded substitute for
// "songs alike". Needs a free key in LASTFM_API_KEY.
//
// Not wired into the main flow by default. To use: after Groq produces seed-ish
// picks, call getSimilarTracks() for a few of them and feed the results back into
// the song list (then resolve them on Spotify like everything else).

const LASTFM_URL = "https://ws.audioscrobbler.com/2.0/";

export interface SimilarTrack {
  artist: string;
  title: string;
}

export async function getSimilarTracks(
  artist: string,
  title: string,
  limit = 10,
): Promise<SimilarTrack[]> {
  const key = process.env.LASTFM_API_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    method: "track.getsimilar",
    artist,
    track: title,
    api_key: key,
    format: "json",
    limit: String(limit),
    autocorrect: "1",
  });

  try {
    const res = await fetch(`${LASTFM_URL}?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    const tracks = data?.similartracks?.track ?? [];
    return (Array.isArray(tracks) ? tracks : [tracks]).map((t: any) => ({
      artist: t?.artist?.name ?? "",
      title: t?.name ?? "",
    })).filter((t: SimilarTrack) => t.artist && t.title);
  } catch {
    return [];
  }
}
