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
        {result.matchedCount} of {result.suggestedCount} suggestions found on Spotify and added
        to your account.
      </p>

      <a
        className="btn accent"
        href={result.playlistUrl}
        target="_blank"
        rel="noreferrer"
        style={{ display: "inline-block", textDecoration: "none", marginBottom: 8 }}
      >
        Open in Spotify ↗
      </a>

      <div style={{ marginTop: 20 }}>
        {result.tracks.map((t, i) => (
          <div className="track" key={i}>
            {t.albumImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="art" src={t.albumImage} alt="" />
            ) : (
              <div className="art" />
            )}
            <div className="meta">
              <div className="name">
                {t.matched ? t.name : t.suggested.title}
              </div>
              <div className="by">
                {t.matched ? t.artist : t.suggested.artist}
                {t.releaseYear ? ` · ${t.releaseYear}` : ""}
              </div>
              {t.suggested.reason && <div className="reason">{t.suggested.reason}</div>}
            </div>
            <span
              className={`badge ${t.matched ? t.suggested.confidence : "miss"}`}
            >
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
