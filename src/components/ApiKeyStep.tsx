"use client";

export function ApiKeyStep({
  groqKey,
  setGroqKey,
  onContinue,
}: {
  groqKey: string;
  setGroqKey: (v: string) => void;
  onContinue: () => void;
}) {
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

      <button className="btn accent" disabled={!groqKey.trim()} onClick={onContinue}>
        Start →
      </button>
    </div>
  );
}
