import type { QualityReport } from "@readmeforge/core/browser";

interface QualityPanelProps {
  report: QualityReport | null;
  onImprove: () => void;
  improving: boolean;
}

function scoreColor(score: number): string {
  if (score >= 80) return "var(--accent-green)";
  if (score >= 50) return "var(--accent-amber)";
  return "var(--accent-red)";
}

export function QualityPanel({ report, onImprove, improving }: QualityPanelProps) {
  if (!report) return null;

  const filled = Math.round((report.score / 100) * 20);
  const bar = "█".repeat(filled) + "░".repeat(20 - filled);
  const weakAreas = report.categories.filter((c) => !c.present || c.weak);

  return (
    <div className="card fade-in" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <div className="panel-heading">README Quality</div>
        <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor(report.score) }}>
          {report.score}
          <span style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 500 }}> / 100</span>
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          letterSpacing: -1,
          color: scoreColor(report.score),
          marginBottom: 14,
        }}
      >
        {bar}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: weakAreas.length > 0 ? 14 : 0 }}>
        {report.categories.map((cat) => (
          <div key={cat.key + cat.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
            <span style={{ color: cat.present && !cat.weak ? "var(--accent-green)" : cat.present ? "var(--accent-amber)" : "var(--text-tertiary)" }}>
              {cat.present && !cat.weak ? "✓" : cat.present ? "⚠" : "⚠"}
            </span>
            <span style={{ color: cat.present && !cat.weak ? "var(--text-secondary)" : "var(--text-primary)" }}>{cat.message}</span>
          </div>
        ))}
      </div>

      {weakAreas.length > 0 && (
        <button className="btn btn-sm" style={{ width: "100%" }} onClick={onImprove} disabled={improving}>
          {improving ? "Improving…" : "Improve README"}
        </button>
      )}
    </div>
  );
}
