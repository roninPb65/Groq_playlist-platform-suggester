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
    </div>
  );
}
