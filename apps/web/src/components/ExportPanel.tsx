import { useState } from "react";
import { readmeSizeLabel } from "@readmeforge/core/browser";

interface ExportPanelProps {
  markdown: string;
  projectPath: string | null;
  onSave: (overwrite: boolean) => Promise<{ written: boolean; existedAlready: boolean }>;
}

export function ExportPanel({ markdown, projectPath, onSave }: ExportPanelProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(markdown);
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 1600);
  }

  function handleDownload() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave(overwrite: boolean) {
    setSaving(true);
    setSaveState("idle");
    try {
      const result = await onSave(overwrite);
      if (!result.written && result.existedAlready) {
        setConfirmOverwrite(true);
      } else {
        setSaveState("saved");
        setConfirmOverwrite(false);
        setSaveMessage(null);
        setTimeout(() => setSaveState("idle"), 2000);
      }
    } catch (err) {
      setSaveState("error");
      setSaveMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card fade-in" style={{ padding: 18 }}>
      <div className="panel-heading" style={{ marginBottom: 10 }}>
        README Ready
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>README.md</span>
        <span className="badge">{readmeSizeLabel(markdown)}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button className="btn" onClick={handleCopy}>
          {copyState === "copied" ? "Copied ✓" : "Copy Markdown"}
        </button>
        <button className="btn" onClick={handleDownload}>
          Download README.md
        </button>
        {projectPath && (
          <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? "Saving…" : "Save to Project"}
          </button>
        )}
      </div>

      {saveState === "saved" && <p style={{ color: "var(--accent-green)", fontSize: 12.5, marginTop: 10 }}>Saved to project ✓</p>}
      {saveState === "error" && <p style={{ color: "var(--accent-red)", fontSize: 12.5, marginTop: 10 }}>{saveMessage}</p>}

      {confirmOverwrite && (
        <div
          className="fade-in"
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-strong)",
            background: "var(--bg-surface-2)",
          }}
        >
          <p style={{ fontSize: 12.5, marginBottom: 10 }}>
            A README.md already exists in this project. Overwrite it?
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={() => setConfirmOverwrite(false)}>
              Cancel
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => handleSave(true)}>
              Overwrite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
