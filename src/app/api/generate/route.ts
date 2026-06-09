import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { buildPrompt } from "@/lib/prompt";
import { getSongsFromGroq } from "@/lib/groq";
import { gatherGrounding } from "@/lib/grounding";
import {
  getOwnerAccessToken,
  resolveTracks,
  createPublicPlaylist,
  addTracks,
} from "@/lib/spotify";
import type { GenerateResponse, QuizAnswers } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { groqApiKey?: string; answers?: QuizAnswers };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const groqApiKey = body.groqApiKey?.trim();
  const answers = body.answers;

  if (!groqApiKey) {
    return NextResponse.json({ error: "A Groq API key is required." }, { status: 400 });
  }
  if (!answers) {
    return NextResponse.json({ error: "Quiz answers are missing." }, { status: 400 });
  }

  try {
    // 1. Optional grounding (returns "" until you wire a provider).
    const grounding = await gatherGrounding(answers);

    // 2. Ask Groq for a confidence-tagged song list (using the visitor's own key).
    const prompt = buildPrompt(answers, grounding);
    const { playlistName, tracks: suggestions } = await getSongsFromGroq(groqApiKey, prompt);
    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: "The model didn't return any songs. Try adjusting your answers." },
        { status: 502 },
      );
    }

    // 3. Use the OWNER token (no visitor login) to resolve + build the playlist.
    const token = await getOwnerAccessToken();
    const resolved = await resolveTracks(token, suggestions, answers.market);
    const matched = resolved.filter((r) => r.matched && r.uri);
    if (matched.length === 0) {
      return NextResponse.json(
        { error: "None of the suggested songs were found on Spotify. Try again." },
        { status: 502 },
      );
    }

    const description =
      `Made with Resonance${answers.place ? ` for ${answers.place}` : ""}` +
      (answers.year ? `, ${answers.year}.` : ".");
    const playlist = await createPublicPlaylist(token, "", playlistName, description);
    await addTracks(token, playlist.id, matched.map((m) => m.uri!));

    // 4. A QR code of the public playlist link, so anyone can scan and listen.
    const qrDataUrl = await QRCode.toDataURL(playlist.url, { width: 320, margin: 1 });

    const response: GenerateResponse = {
      playlistName,
      playlistUrl: playlist.url,
      qrDataUrl,
      matchedCount: matched.length,
      suggestedCount: suggestions.length,
      tracks: resolved,
    };
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
