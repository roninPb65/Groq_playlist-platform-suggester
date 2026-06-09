"use client";

import type { GenerateResponse } from "@/lib/types";

export function ResultStep({
  result,
  onRestart,
}: {
  result: GenerateResponse;
  onRestart: () => void;
}) {
  return (
    <div className="card">
      <h2>{result.playlistName}</h2>
      <p className="hint">
        {result.matchedCount} of {result.suggestedCount} suggestions found on Spotify. Scan the code
        or open the link — then save it in Spotify if you like it.
      </p>

      <div className="share">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="qr" src={result.qrDataUrl} alt="QR code to open the playlist in Spotify" />
        <div className="share-actions">
          <a
            className="btn accent"
            href={result.playlistUrl}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-block", textDecoration: "none" }}
          >
            Open in Spotify ↗
          </a>
          <p className="hint" style={{ margin: "10px 0 0" }}>
            Point a phone camera at the code to open this playlist on Spotify.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        {result.tracks.map((t, i) => (
          <div className="track" key={i}>
            {t.albumImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="art" src={t.albumImage} alt="" />
            ) : (
              <div className="art" />
            )}
            <div className="meta">
              <div className="name">{t.matched ? t.name : t.suggested.title}</div>
              <div className="by">
                {t.matched ? t.artist : t.suggested.artist}
                {t.releaseYear ? ` · ${t.releaseYear}` : ""}
              </div>
              {t.suggested.reason && <div className="reason">{t.suggested.reason}</div>}
            </div>
            <span className={`badge ${t.matched ? t.suggested.confidence : "miss"}`}>
              {t.matched ? t.suggested.confidence : "not found"}
            </span>
          </div>
        ))}
      </div>

      <p className="hint" style={{ marginTop: 20 }}>
        Confidence shows how sure the model was; &quot;not found&quot; songs were suggested but
        aren&apos;t on Spotify, so they were skipped.
      </p>

      <button className="btn ghost" onClick={onRestart} style={{ marginTop: 8 }}>
        Make another
      </button>

      {/* Spotify attribution — required by Spotify Developer Terms */}
      <p className="hint" style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 6 }}>
        <svg role="img" viewBox="0 0 24 24" width="16" height="16" fill="#1DB954" aria-label="Spotify" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
        Powered by{" "}
        <a href="https://www.spotify.com" target="_blank" rel="noreferrer" style={{ color: "#1DB954" }}>
          Spotify
        </a>
      </p>
    </div>
  );
}
