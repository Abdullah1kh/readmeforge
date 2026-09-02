import { useEffect, useRef, useState } from "react";
import type { AnalyzeProgressEvent, ProjectInfo } from "@readmeforge/core/browser";
import { analyzeStream } from "../lib/api.js";

const STEP_LABELS: Array<{ step: string; label: string }> = [
  { step: "language", label: "Detecting languages" },
  { step: "framework", label: "Detecting framework" },
  { step: "package", label: "Reading package configuration" },
  { step: "structure", label: "Analyzing project structure" },
  { step: "scripts", label: "Detecting scripts" },
  { step: "env", label: "Detecting environment configuration" },
  { step: "docs", label: "Checking documentation" },
  { step: "context", label: "Preparing README context" },
];

interface AnalyzingProps {
  path: string;
  onComplete: (project: ProjectInfo) => void;
  onError: (message: string) => void;
}

export function Analyzing({ path, onComplete, onError }: AnalyzingProps) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    analyzeStream(path, (event: AnalyzeProgressEvent) => {
      if (event.status === "done") {
        setDone((prev) => new Set(prev).add(event.step));
      }
    })
      .then((project) => {
        setTimeout(() => onComplete(project), 350);
      })
      .catch((err) => onError(err instanceof Error ? err.message : "Analysis failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const completedCount = done.size;
  const progressPct = Math.round((completedCount / STEP_LABELS.length) * 100);

  return (
    <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card fade-in" style={{ width: 480, padding: 32 }}>
        <div className="panel-heading" style={{ marginBottom: 4 }}>
          Analyzing Project
        </div>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 20, fontFamily: "var(--font-mono)" }}>
          {path}
        </div>

        <div style={{ height: 4, borderRadius: 999, background: "var(--bg-surface-2)", overflow: "hidden", marginBottom: 24 }}>
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {STEP_LABELS.map(({ step, label }) => {
            const isDone = done.has(step);
            return (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13.5 }}>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 999,
                    fontSize: 10,
                    flexShrink: 0,
                    color: isDone ? "#0a0a0c" : "var(--text-tertiary)",
                    background: isDone ? "var(--accent-green)" : "transparent",
                    border: isDone ? "none" : "1px solid var(--border-strong)",
                  }}
                  className={!isDone ? "pulse" : undefined}
                >
                  {isDone ? "✓" : ""}
                </span>
                <span style={{ color: isDone ? "var(--text-primary)" : "var(--text-tertiary)" }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
