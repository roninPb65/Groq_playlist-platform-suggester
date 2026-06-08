import type { QuizAnswers } from "./types";

const ENERGY_WORDS = ["very calm", "calm", "balanced", "lively", "high-energy"];

// Builds the system + user messages for Groq.
// The system message encodes the product's accuracy principles; the user
// message carries the listener's signals plus any retrieved grounding.
export function buildPrompt(
  answers: QuizAnswers,
  grounding: string,
): { system: string; user: string } {
  const count = Math.max(10, Math.min(40, answers.count || 20));

  const system = [
    "You are a music curator that reconstructs the soundtrack of a person's life",
    "and recommends songs that genuinely belong together. You return ONLY valid JSON.",
    "",
    "Principles you must follow:",
    "- Reminiscence bump: weight songs from the listener's teens and early twenties",
    "  most heavily, since that music imprints most strongly.",
    "- Respect language, region and culture. A place does not imply one language or",
    "  ethnicity. Include the languages and local scenes the listener names, and do NOT",
    "  default to Western/English music unless it genuinely fits their context.",
    "- Prefer songs that were actually popular in the listener's place and time over",
    "  generic genre-filler. Use any grounding facts provided as the source of truth.",
    "- Do NOT invent songs and do NOT guess years you are unsure of. If you are not",
    "  confident a track is real and fits, mark it low confidence or leave it out.",
    "- Give each track a short, human, one-line reason and an honest confidence level.",
    "",
    `Return between ${count - 2} and ${count} tracks.`,
    "Respond with JSON in EXACTLY this shape and nothing else:",
    '{ "playlistName": string, "tracks": [ { "artist": string, "title": string,',
    '  "year": number|null, "reason": string, "confidence": "high"|"medium"|"low" } ] }',
    "No markdown, no code fences, no commentary outside the JSON.",
  ].join("\n");

  const energy = ENERGY_WORDS[Math.max(0, Math.min(4, answers.energy - 1))];

  const lines: string[] = [
    "Build a playlist for this listener.",
    "",
    `Lived in: ${answers.place || "(not given)"}`,
    `Year of that period: ${answers.year || "(not given)"}`,
    `Age then: ${answers.ageThen || "(not given)"}`,
    `Languages / scenes that were theirs: ${answers.languages || "(not given)"}`,
    `Genres they lean toward: ${answers.genres.length ? answers.genres.join(", ") : "(open)"}`,
    `Mood: ${answers.mood || "(open)"}`,
    `Preferred energy: ${energy}`,
  ];

  if (grounding && grounding.trim()) {
    lines.push(
      "",
      "Grounding facts retrieved for this place/time (treat as authoritative):",
      grounding.trim(),
    );
  }

  return { system, user: lines.join("\n") };
}
