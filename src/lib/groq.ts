import type { SongSuggestion } from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

interface GroqResult {
  playlistName: string;
  tracks: SongSuggestion[];
}

// Calls Groq with the USER'S api key (passed in per request, never stored,
// never logged). Returns the parsed song list + a suggested playlist name.
export async function getSongsFromGroq(
  apiKey: string,
  prompt: { system: string; user: string },
): Promise<GroqResult> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    }),
  });

  if (!res.ok) {
    // Surface a useful message but never echo the key.
    const detail = await res.text().catch(() => "");
    if (res.status === 401) {
      throw new Error("Groq rejected the API key. Check that it is valid.");
    }
    if (res.status === 429) {
      throw new Error("Groq rate limit reached for this key. Try again shortly.");
    }
    throw new Error(`Groq request failed (${res.status}). ${truncate(detail)}`);
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "{}";

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Groq returned content that was not valid JSON.");
  }

  const obj = parsed as Record<string, unknown>;
  const rawTracks = Array.isArray(obj.tracks) ? obj.tracks : [];

  const tracks: SongSuggestion[] = rawTracks
    .map(normalizeTrack)
    .filter((t): t is SongSuggestion => t !== null);

  const playlistName =
    typeof obj.playlistName === "string" && obj.playlistName.trim()
      ? obj.playlistName.trim()
      : "Your Resonance playlist";

  return { playlistName, tracks };
}

function normalizeTrack(raw: unknown): SongSuggestion | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.artist !== "string" || typeof r.title !== "string") return null;
  const conf = r.confidence;
  const confidence =
    conf === "high" || conf === "medium" || conf === "low" ? conf : "medium";
  const year =
    typeof r.year === "number" && Number.isFinite(r.year) ? r.year : null;
  return {
    artist: r.artist.trim(),
    title: r.title.trim(),
    year,
    reason: typeof r.reason === "string" ? r.reason.trim() : "",
    confidence,
  };
}

function truncate(s: string, n = 200): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
