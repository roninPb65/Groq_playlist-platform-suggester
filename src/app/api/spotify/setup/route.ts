import { NextRequest, NextResponse } from "next/server";

// ONE-TIME SETUP ROUTE.
// Visit /api/spotify/setup once (as the account that should own the playlists).
// It runs the OAuth flow and shows you a refresh token to paste into Render as
// SPOTIFY_REFRESH_TOKEN. After that, you can delete this file.
//
// Requires env vars: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, APP_URL.
// Register this redirect URI in your Spotify app:
//   {APP_URL}/api/spotify/setup

const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
// Only the scope we actually use: creating public playlists on the owner account.
// playlist-modify-private and user-read-private were requested previously but
// are not used by this app — requesting unused scopes violates least-privilege.
const SCOPES = "playlist-modify-public";

function redirectUri(): string {
  const base = (process.env.APP_URL || "").replace(/\/$/, "");
  // Enforce HTTPS in production. http://127.0.0.1 is the only allowed
  // non-HTTPS URI per Spotify's redirect URI policy.
  if (!base.startsWith("https://") && !base.startsWith("http://127.0.0.1")) {
    throw new Error(
      `APP_URL must use HTTPS in production (got: ${base}). ` +
      "Only http://127.0.0.1 is allowed for local development.",
    );
  }
  return `${base}/api/spotify/setup`;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret || !process.env.APP_URL) {
    return new NextResponse(
      "Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and APP_URL in your environment first.",
      { status: 500 },
    );
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // Step 1: no code yet -> send the owner to Spotify's consent screen.
  if (!code) {
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri(),
      scope: SCOPES,
    });
    return NextResponse.redirect(`${AUTHORIZE}?${params.toString()}`);
  }

  // Step 2: exchange the code and show the refresh token.
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.refresh_token) {
    return new NextResponse(`Token exchange failed: ${JSON.stringify(data)}`, { status: 500 });
  }

  const html = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 16px;line-height:1.6">
  <h2>Spotify connected &#10003;</h2>
  <p>Copy the value below into Render as <code>SPOTIFY_REFRESH_TOKEN</code>, then redeploy.
     Once that's done you can safely delete this route file.</p>
  <textarea readonly rows="4" style="width:100%;font-family:monospace;font-size:13px;padding:10px"
    onclick="this.select()">${data.refresh_token}</textarea>
  <p style="color:#888;font-size:13px">This token grants playlist access to this account. Keep it private.</p>
</body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
