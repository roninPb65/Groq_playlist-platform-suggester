"use client";

import { useState, useEffect } from "react";

export function ApiKeyStep({
  groqKey,
  initialGroqKey,
  setGroqKey,
  onContinue,
}: {
  groqKey?: string;
  initialGroqKey?: string;
  setGroqKey: (v: string) => void;
  onContinue: () => void;
}) {
  const defaultKey =
    "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";

  const [localKey, setLocalKey] = useState("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");

  // 👇 THIS is the fix (sync when props arrive)
  useEffect(() => {
    setLocalKey(defaultKey);
    setGroqKey(defaultKey);
  }, [defaultKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalKey(value);
    setGroqKey(value);
  };

  return (
    <div className="card">
      <h2>Add your Groq key</h2>

      <p className="hint">
        Used only in your browser and never stored on our servers.
      </p>

      <div className="field">
        <label htmlFor="groq">Groq API key</label>

        <input
          id="groq"
          type="password"
          placeholder="gsk_..."
          value={localKey}
          autoComplete="off"
          spellCheck={false}
          onChange={handleChange}
        />

        <p className="hint" style={{ marginTop: 8 }}>
          Get a free key at{" "}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
          >
            console.groq.com/keys
          </a>
        </p>
      </div>

      <button className="btn accent" onClick={onContinue}>
        Start →
      </button>
    </div>
  );
}
