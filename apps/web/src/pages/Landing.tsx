import { useState } from "react";
import { pickFolder } from "../lib/api.js";

interface LandingProps {
  onSelectLocal: (path: string) => void;
  onSelectGitHub: (url: string) => void;
}

export function Landing({ onSelectLocal, onSelectGitHub }: LandingProps) {
  const [manualPath, setManualPath] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [showGithubInput, setShowGithubInput] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  async function handleBrowse() {
    setPicking(true);
    setPickerError(null);
    try {
      const path = await pickFolder();
      onSelectLocal(path);
    } catch (err) {
      if (err instanceof Error && err.message.includes("only implemented for macOS")) {
        setShowManualInput(true);
      } else {
        setPickerError(err instanceof Error ? err.message : "Could not open folder picker");
      }
    } finally {
      setPicking(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(600px circle at 20% 15%, color-mix(in srgb, var(--accent-purple) 8%, transparent), transparent 60%), radial-gradient(600px circle at 80% 85%, color-mix(in srgb, var(--accent-cyan) 6%, transparent), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div className="fade-in" style={{ position: "relative", maxWidth: 620, width: "100%", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 12px",
            borderRadius: 999,
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            fontSize: 12,
            color: "var(--text-secondary)",
            marginBottom: 28,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent-green)" }} />
          Local-first &middot; no account required
        </div>

        <h1
          style={{
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: "0 0 14px",
            background: "linear-gradient(135deg, #f4f4f6 0%, #b9b4e8 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          ReadmeForge
        </h1>
        <p style={{ fontSize: 17, color: "var(--text-secondary)", margin: "0 0 6px", lineHeight: 1.55 }}>
          Turn any codebase into a professional README.
        </p>
        <p style={{ fontSize: 14, color: "var(--text-tertiary)", margin: "0 0 40px", lineHeight: 1.6 }}>
          Analyze your project, generate documentation, and preview it exactly like GitHub.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" style={{ height: 44, padding: "0 22px" }} onClick={handleBrowse} disabled={picking}>
            {picking ? "Opening picker…" : "Select Local Folder"}
          </button>
          <button
            className="btn"
            style={{ height: 44, padding: "0 22px" }}
            onClick={() => setShowGithubInput((v) => !v)}
          >
            Analyze GitHub Repository
          </button>
        </div>

        {pickerError && (
          <p style={{ color: "var(--accent-red)", fontSize: 13, marginTop: 14 }}>{pickerError}</p>
        )}

        {showManualInput && (
          <form
            className="card fade-in"
            style={{ marginTop: 20, padding: 16, display: "flex", gap: 8 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (manualPath.trim()) onSelectLocal(manualPath.trim());
            }}
          >
            <input
              className="input"
              placeholder="/path/to/your/project"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              autoFocus
            />
            <button className="btn btn-primary" type="submit" disabled={!manualPath.trim()}>
              Analyze
            </button>
          </form>
        )}

        {showGithubInput && (
          <form
            className="card fade-in"
            style={{ marginTop: 20, padding: 16, display: "flex", gap: 8 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (githubUrl.trim()) onSelectGitHub(githubUrl.trim());
            }}
          >
            <input
              className="input"
              placeholder="https://github.com/user/project"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              autoFocus
            />
            <button className="btn btn-primary" type="submit" disabled={!githubUrl.trim()}>
              Analyze
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: 44,
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            fontSize: 12.5,
            color: "var(--text-tertiary)",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            textAlign: "left",
          }}
        >
          <span style={{ color: "var(--accent-cyan)", flexShrink: 0 }}>&#128274;</span>
          <span>
            Local projects stay on your machine unless you explicitly configure a remote AI provider.
            <code>.env</code>, credentials, and keys are never read or sent anywhere.
          </span>
        </div>
      </div>
    </div>
  );
}
