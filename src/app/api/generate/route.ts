import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildPrompt } from "@/lib/prompt";
import { getSongsFromGroq } from "@/lib/groq";
import { gatherGrounding } from "@/lib/grounding";
import {
  getCurrentUser,
  resolveTracks,
  createPlaylist,
  addTracks,
} from "@/lib/spotify";
import type { GenerateResponse, QuizAnswers } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  const accessToken = (session as any)?.accessToken as string | undefined;
  const sessionError = (session as any)?.error as string | undefined;

  if (!accessToken || sessionError) {
    return NextResponse.json(
      { error: "Please connect your Spotify account (or reconnect — the session expired)." },
      { status: 401 },
    );
  }

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

    // 2. Ask Groq for a confidence-tagged song list (using the user's own key).
    const prompt = buildPrompt(answers, grounding);
    const { playlistName, tracks: suggestions } = await getSongsFromGroq(groqApiKey, prompt);

    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: "The model didn't return any songs. Try adjusting your answers." },
        { status: 502 },
      );
    }

    // 3. Resolve each suggestion to a real Spotify track.
    const resolved = await resolveTracks(accessToken, suggestions, answers.market);
    const matched = resolved.filter((r) => r.matched && r.uri);

    if (matched.length === 0) {
      return NextResponse.json(
        { error: "None of the suggested songs were found on Spotify. Try again." },
        { status: 502 },
      );
    }

    // 4. Create the playlist on the user's account and add the tracks.
    const me = await getCurrentUser(accessToken);
    const description =
      `Made with Resonance for ${answers.place || "you"}` +
      (answers.year ? `, ${answers.year}.` : ".");
    const playlist = await createPlaylist(accessToken, me.id, playlistName, description);
    await addTracks(accessToken, playlist.id, matched.map((m) => m.uri!));

    const response: GenerateResponse = {
      playlistName,
      playlistUrl: playlist.url,
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
