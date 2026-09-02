import { useState } from "react";
import type { ProjectInfo } from "@readmeforge/core/browser";
import { Landing } from "./pages/Landing.js";
import { Analyzing } from "./pages/Analyzing.js";
import { GitHubReview } from "./pages/GitHubReview.js";
import { Workspace } from "./pages/Workspace.js";

type Mode =
  | { kind: "landing" }
  | { kind: "analyzing-local"; path: string }
  | { kind: "analyzing-github"; url: string }
  | { kind: "workspace"; project: ProjectInfo; projectPath: string | null };

export default function App() {
  const [mode, setMode] = useState<Mode>({ kind: "landing" });
  const [toast, setToast] = useState<string | null>(null);

  function showError(message: string) {
    setToast(message);
    setMode({ kind: "landing" });
    setTimeout(() => setToast(null), 5000);
  }

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      {toast && (
        <div
          className="fade-in"
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--bg-surface-3)",
            border: "1px solid var(--accent-red)",
            color: "#ffb4b4",
            padding: "10px 16px",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            zIndex: 100,
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          {toast}
        </div>
      )}

      {mode.kind === "landing" && (
        <Landing
          onSelectLocal={(path) => setMode({ kind: "analyzing-local", path })}
          onSelectGitHub={(url) => setMode({ kind: "analyzing-github", url })}
        />
      )}

      {mode.kind === "analyzing-local" && (
        <Analyzing
          path={mode.path}
          onComplete={(project) => setMode({ kind: "workspace", project, projectPath: mode.path })}
          onError={showError}
        />
      )}

      {mode.kind === "analyzing-github" && (
        <GitHubReview
          url={mode.url}
          onReady={(project) => setMode({ kind: "workspace", project, projectPath: null })}
          onError={showError}
        />
      )}

      {mode.kind === "workspace" && (
        <Workspace project={mode.project} projectPath={mode.projectPath} onBack={() => setMode({ kind: "landing" })} />
      )}
    </div>
  );
}
