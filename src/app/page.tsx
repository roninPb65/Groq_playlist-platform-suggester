"use client";

import { useEffect, useState } from "react";
import { ApiKeyStep } from "@/components/ApiKeyStep";
import { QuizStep } from "@/components/QuizStep";
import { ResultStep } from "@/components/ResultStep";
import type { GenerateResponse, QuizAnswers } from "@/lib/types";

const SESSION_KEY = "resonance.groqKey";

const DEFAULT_ANSWERS: QuizAnswers = {
  genres: [],
  mood: "Nostalgic",
  energy: 3,
  place: "",
  year: "",
  ageThen: "",
  languages: "",
  market: "",
  count: 20,
};

type Step = "key" | "quiz" | "result";

export default function Home() {
  const [step, setStep] = useState<Step>("key");
  const [groqKey, setGroqKeyState] = useState("");
  const [answers, setAnswers] = useState<QuizAnswers>(DEFAULT_ANSWERS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResponse | null>(null);

  // Restore the Groq key from this tab's sessionStorage (never leaves the browser
  // except as a per-request payload to our API).
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setGroqKeyState(saved);
  }, []);

  const setGroqKey = (v: string) => {
    setGroqKeyState(v);
    if (v) sessionStorage.setItem(SESSION_KEY, v);
    else sessionStorage.removeItem(SESSION_KEY);
  };

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groqApiKey: groqKey, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setResult(data as GenerateResponse);
      setStep("result");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="wrap">
      <div className="brand">
        <h1>Resonance</h1>
        <span className="dot" />
      </div>
      <p className="tagline">
        The soundtrack of your life — rebuilt from where you were and when, and turned into a
        playlist you can scan and share.
      </p>

      {step === "key" && (
        <ApiKeyStep groqKey={groqKey} setGroqKey={setGroqKey} onContinue={() => setStep("quiz")} />
      )}

      {step === "quiz" && (
        <>
          <QuizStep
            answers={answers}
            setAnswers={setAnswers}
            onGenerate={generate}
            onBack={() => setStep("key")}
            busy={busy}
          />
          {busy && (
            <div className="loader">Reconstructing your soundscape and matching it to Spotify…</div>
          )}
          {error && <div className="error">{error}</div>}
        </>
      )}

      {step === "result" && result && (
        <ResultStep
          result={result}
          onRestart={() => {
            setResult(null);
            setError("");
            setStep("quiz");
          }}
        />
      )}

      <p className="foot">
        Your Groq key stays in this browser tab and is sent only with your own request — never
        stored on the server. Playlists are created on the app&apos;s Spotify account and shared
        publicly via link and QR, so anyone can open and save them. See the README to extend
        grounding and similarity.
      </p>
    </main>
  );
}
