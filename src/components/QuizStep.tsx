"use client";

import type { QuizAnswers } from "@/lib/types";

const GENRES = [
  "Pop", "Hip-Hop", "R&B", "Rock", "Indie", "Electronic", "Bollywood",
  "Punjabi", "K-pop", "Afrobeats", "Latin", "Reggaeton", "Jazz",
  "Classical", "Folk", "Metal", "Lo-fi",
];

const MOODS = ["Nostalgic", "Upbeat", "Chill", "Melancholy", "Romantic", "Focus"];

const ENERGY_LABELS = ["Very calm", "Calm", "Balanced", "Lively", "High energy"];

export function QuizStep({
  answers,
  setAnswers,
  onGenerate,
  onBack,
  busy,
}: {
  answers: QuizAnswers;
  setAnswers: (a: QuizAnswers) => void;
  onGenerate: () => void;
  onBack: () => void;
  busy: boolean;
}) {
  const toggleGenre = (g: string) => {
    const has = answers.genres.includes(g);
    setAnswers({
      ...answers,
      genres: has ? answers.genres.filter((x) => x !== g) : [...answers.genres, g],
    });
  };

  return (
    <div className="card">
      <h2>Tell us where you&apos;ve listened</h2>
      <p className="hint">
        The more honest the place and time, the more it will feel like yours.
      </p>

      <div className="field">
        <label>
          Genres you lean toward <span className="sub">— pick any</span>
        </label>
        <div className="chips">
          {GENRES.map((g) => (
            <button
              key={g}
              className={`chip ${answers.genres.includes(g) ? "on" : ""}`}
              onClick={() => toggleGenre(g)}
              type="button"
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Mood</label>
        <div className="chips">
          {MOODS.map((m) => (
            <button
              key={m}
              className={`chip ${answers.mood === m ? "on" : ""}`}
              onClick={() => setAnswers({ ...answers, mood: m })}
              type="button"
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Energy</label>
        <div className="slider">
          <input
            type="range"
            min={1}
            max={5}
            value={answers.energy}
            onChange={(e) => setAnswers({ ...answers, energy: Number(e.target.value) })}
          />
          <span className="val">{ENERGY_LABELS[answers.energy - 1]}</span>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="place">Where did you live?</label>
          <input
            id="place"
            type="text"
            placeholder="Chandigarh, India"
            value={answers.place}
            onChange={(e) => setAnswers({ ...answers, place: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="lang">
            Languages / scenes <span className="sub">— that were yours</span>
          </label>
          <input
            id="lang"
            type="text"
            placeholder="Punjabi, Hindi, English"
            value={answers.languages}
            onChange={(e) => setAnswers({ ...answers, languages: e.target.value })}
          />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="year">Around which year?</label>
          <input
            id="year"
            type="number"
            placeholder="2012"
            value={answers.year}
            onChange={(e) => setAnswers({ ...answers, year: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="age">How old were you then?</label>
          <input
            id="age"
            type="number"
            placeholder="16"
            value={answers.ageThen}
            onChange={(e) => setAnswers({ ...answers, ageThen: e.target.value })}
          />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="market">
            Country code <span className="sub">— optional, e.g. IN, US, NG</span>
          </label>
          <input
            id="market"
            type="text"
            placeholder="IN"
            maxLength={2}
            value={answers.market || ""}
            onChange={(e) =>
              setAnswers({ ...answers, market: e.target.value.toUpperCase() })
            }
          />
        </div>
        <div className="field">
          <label htmlFor="count">How many songs?</label>
          <input
            id="count"
            type="number"
            min={10}
            max={40}
            value={answers.count}
            onChange={(e) => setAnswers({ ...answers, count: Number(e.target.value) })}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button className="btn ghost" onClick={onBack} disabled={busy}>
          ← Back
        </button>
        <button className="btn accent" onClick={onGenerate} disabled={busy}>
          {busy ? "Building…" : "Build my playlist"}
        </button>
      </div>
    </div>
  );
}
