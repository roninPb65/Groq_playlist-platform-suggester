"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function ConnectStep({
  groqKey,
  setGroqKey,
  onContinue,
}: {
  groqKey: string;
  setGroqKey: (v: string) => void;
  onContinue: () => void;
}) {
  const { data: session, status } = useSession();
  const spotifyConnected = !!session && !(session as any).error;
  const ready = groqKey.trim().length > 0 && spotifyConnected;

  return (
    <div className="card">
      <h2>Connect</h2>
      <p className="hint">
        Two quick connections and you&apos;re set. Nothing here is stored on our servers.
      </p>

      <div className="field">
        <label htmlFor="groq">
          Your Groq API key{" "}
          <span className="sub">
            — used only for your requests, kept in this browser tab, never saved
          </span>
        </label>
        <input
          id="groq"
          type="password"
          placeholder="gsk_..."
          value={groqKey}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setGroqKey(e.target.value)}
        />
        <p className="hint" style={{ margin: "8px 0 0" }}>
          Get a free key at{" "}
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
            console.groq.com/keys
          </a>
          .
        </p>
      </div>

      <div className="field">
        <label>Spotify account</label>
        {spotifyConnected ? (
          <span className="status">
            <span className="tick">✓</span> Connected as{" "}
            {session?.user?.name || "you"} ·{" "}
            <button
              className="btn ghost"
              style={{ padding: "2px 6px", fontSize: 13, border: "none" }}
              onClick={() => signOut()}
            >
              disconnect
            </button>
          </span>
        ) : (
          <button
            className="btn"
            disabled={status === "loading"}
            onClick={() => signIn("spotify")}
          >
            Connect Spotify
          </button>
        )}
      </div>

      <button className="btn accent" disabled={!ready} onClick={onContinue}>
        Start →
      </button>
    </div>
  );
}
