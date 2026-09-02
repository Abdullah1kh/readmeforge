import { useEffect, useState } from "react";
import type { ProjectInfo } from "@readmeforge/core/browser";
import { scoreReadme } from "@readmeforge/core/browser";
import { analyzeGitHub } from "../lib/api.js";

interface GitHubReviewProps {
  url: string;
  onReady: (project: ProjectInfo) => void;
  onError: (message: string) => void;
}

export function GitHubReview({ url, onReady, onError }: GitHubReviewProps) {
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    analyzeGitHub(url)
      .then((p) => {
        if (!cancelled) {
          setProject(p);
          setLoading(false);
        }
      })
      .catch((err) => onError(err instanceof Error ? err.message : "Could not analyze repository"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (loading || !project) {
    return (
      <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-tertiary)", fontSize: 13 }} className="pulse">
          Fetching repository metadata…
        </div>
      </div>
    );
  }

  const report = project.hasExistingReadme && project.existingReadmeContent
    ? scoreReadme(project.existingReadmeContent)
    : null;

  const filled = report ? Math.round((report.score / 100) * 20) : 0;
  const bar = "█".repeat(filled) + "░".repeat(20 - filled);

  return (
    <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card fade-in" style={{ width: 520, padding: 32 }}>
        <div className="panel-heading" style={{ marginBottom: 6 }}>
          {project.git.remoteName}
        </div>
        <h2 style={{ fontSize: 20, margin: "0 0 18px" }}>{project.name}</h2>

        {report ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
              <span className="panel-heading">README Quality</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{report.score} / 100</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent-amber)", marginBottom: 16 }}>{bar}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
              {report.categories
                .filter((c) => !c.present || c.weak)
                .slice(0, 6)
                .map((c) => (
                  <div key={c.label} style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                    ⚠ {c.message}
                  </div>
                ))}
              {report.categories
                .filter((c) => c.present && !c.weak)
                .slice(0, 3)
                .map((c) => (
                  <div key={c.label} style={{ fontSize: 12.5, color: "var(--accent-green)" }}>
                    ✓ {c.message}
                  </div>
                ))}
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
            This repository has no README. ReadmeForge will generate one from its detected metadata.
          </p>
        )}

        <button className="btn btn-primary" style={{ width: "100%", height: 40 }} onClick={() => onReady(project)}>
          Generate Improved README
        </button>
      </div>
    </div>
  );
}
