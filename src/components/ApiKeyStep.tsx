"use client";

import { useState, useEffect } from "react";

export function ApiKeyStep({
  initialGroqKey = "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",
  isDemoUser = false,
  setGroqKey,
  onContinue,
}: {
  initialGroqKey?: string;
  isDemoUser?: boolean;
  setGroqKey: (v: string) => void;
  onContinue: () => void;
}) {
  const [groqKey, setLocalGroqKey] = useState(initialGroqKey);

  // Optional: auto-fill for demo users
  useEffect(() => {
    if (isDemoUser && initialGroqKey) {
      setLocalGroqKey(initialGroqKey);
      setGroqKey(initialGroqKey);
    }
  }, [isDemoUser, initialGroqKey, setGroqKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalGroqKey(value);
    setGroqKey(value);
  };

  return (
    <div className="card">
      <h2>Add your Groq key</h2>

      <p className="hint">
        Used only for your requests, kept in this browser tab, and never saved on our servers.
      </p>

      <div className="field">
        <label htmlFor="groq">Groq API key</label>

        <input
          id="groq"
          type="password"
          placeholder="gsk_..."
          value={groqKey}
          autoComplete="off"
          spellCheck={false}
          onChange={handleChange}
        />

        <p className="hint" style={{ margin: "8px 0 0" }}>
          Get a free key at{" "}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
          >
            console.groq.com/keys
          </a>
          .
        </p>
      </div>

      <button className="btn accent" onClick={onContinue}>
        Start →
      </button>
    </div>
  );
}
