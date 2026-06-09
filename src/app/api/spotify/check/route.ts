import { NextResponse } from "next/server";
import { getOwnerAccessToken, checkSpotifyAuthorization } from "@/lib/spotify";

// ---------------------------------------------------------------------------
// GET /api/spotify/check
// ---------------------------------------------------------------------------
// Health-check endpoint that verifies Spotify is fully authorised before
// any user triggers a playlist generation. Hit this after deployment or
// after rotating SPOTIFY_REFRESH_TOKEN to confirm everything is wired up.
//
// Returns 200  { ok: true,  message: "Spotify authorisation OK" }
// Returns 500  { ok: false, message: "<actionable error description>" }
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = await getOwnerAccessToken();
    await checkSpotifyAuthorization(token);
    return NextResponse.json({ ok: true, message: "Spotify authorisation OK" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Spotify authorisation error.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
