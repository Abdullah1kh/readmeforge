import { useEffect, useMemo, useState } from "react";
import type { ProjectInfo, ProviderId, QualityReport, ReadmeGenerationOptions } from "@readmeforge/core/browser";
import { defaultReadmeOptions, scoreReadme as scoreReadmeLocal } from "@readmeforge/core/browser";
import { ControlsPanel } from "../components/ControlsPanel.js";
import { MarkdownEditor } from "../components/MarkdownEditor.js";
import { GithubPreview } from "../components/GithubPreview.js";
import { QualityPanel } from "../components/QualityPanel.js";
import { ExportPanel } from "../components/ExportPanel.js";
import { ImageManager } from "../components/ImageManager.js";
import { ProviderSelector } from "../components/ProviderSelector.js";
import {
  fetchProviders,
  generateReadme,
  improveReadme,
  saveReadme,
  saveAssets,
  type ProviderConfig,
  type ProviderDescriptor,
} from "../lib/api.js";

type Tab = "editor" | "preview" | "github";

interface WorkspaceProps {
  project: ProjectInfo;
  projectPath: string | null;
  onBack: () => void;
}

const PROVIDER_STORAGE_KEY = "readmeforge:provider";

function loadStoredProvider(): { providerId: ProviderId; config: ProviderConfig } {
  try {
    const raw = localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return { providerId: "none", config: {} };
}

export function Workspace({ project, projectPath, onBack }: WorkspaceProps) {
  const [options, setOptions] = useState<ReadmeGenerationOptions>(defaultReadmeOptions());
  const [markdown, setMarkdown] = useState("");
  const [tab, setTab] = useState<Tab>("editor");
  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderDescriptor[]>([]);
  const [{ providerId, config: providerConfig }, setProviderState] = useState(loadStoredProvider);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    fetchProviders().then(setProviders).catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify({ providerId, config: providerConfig }));
  }, [providerId, providerConfig]);

  useEffect(() => {
    if (!hasGenerated) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!markdown) {
      setQualityReport(null);
      return;
    }
    const timeout = setTimeout(() => setQualityReport(scoreReadmeLocal(markdown)), 250);
    return () => clearTimeout(timeout);
  }, [markdown]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateReadme(project, options, providerId, providerConfig);
      setMarkdown(result.markdown);
      setHasGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleImprove() {
    if (!qualityReport) return;
    setImproving(true);
    setError(null);
    const weakAreas = qualityReport.categories.filter((c) => !c.present || c.weak).map((c) => c.label);
    try {
      const result = await improveReadme(markdown, project, weakAreas, providerId, providerConfig);
      setMarkdown(result.markdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Improvement requires a configured AI provider");
    } finally {
      setImproving(false);
    }
  }

  async function handleSave(overwrite: boolean) {
    if (!projectPath) throw new Error("No project path available");
    const result = await saveReadme(projectPath, markdown, overwrite);
    if (result.written && options.images.length > 0) {
      await saveAssets(
        projectPath,
        options.images.filter((i) => i.dataUrl).map((i) => ({ fileName: i.fileName, dataUrl: i.dataUrl! }))
      ).catch(() => undefined);
    }
    return result;
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "editor", label: "Editor" },
    { id: "preview", label: "Preview" },
    { id: "github", label: "GitHub Preview" },
  ];

  const projectMeta = useMemo(
    () => [project.language[0], project.framework[0], project.packageManager].filter(Boolean).join(" · "),
    [project]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 18px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            ← Projects
          </button>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{project.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{projectMeta}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg-surface)", padding: 3, borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="btn btn-sm btn-ghost"
              style={{
                background: tab === t.id ? "var(--bg-surface-3)" : "transparent",
                color: tab === t.id ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <ProviderSelector
          providers={providers}
          providerId={providerId}
          providerConfig={providerConfig}
          onChange={(id, cfg) => setProviderState({ providerId: id, config: cfg })}
        />
      </header>

      {error && (
        <div style={{ padding: "8px 18px", background: "color-mix(in srgb, var(--accent-red) 12%, transparent)", color: "#ffb4b4", fontSize: 12.5 }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr 300px", overflow: "hidden" }}>
        <aside style={{ borderRight: "1px solid var(--border-subtle)", overflow: "hidden" }}>
          <ControlsPanel options={options} onChange={setOptions} onRegenerate={handleGenerate} isGenerating={generating} />
        </aside>

        <main style={{ overflow: "auto", padding: tab === "editor" ? 0 : 24 }} className="scrollbar-thin">
          {generating && !markdown ? (
            <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
              Generating your README…
            </div>
          ) : tab === "editor" ? (
            <MarkdownEditor value={markdown} onChange={setMarkdown} />
          ) : tab === "preview" ? (
            <GithubPreview markdown={markdown} chrome={false} />
          ) : (
            <GithubPreview markdown={markdown} chrome />
          )}
        </main>

        <aside style={{ borderLeft: "1px solid var(--border-subtle)", overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }} className="scrollbar-thin">
          <QualityPanel report={qualityReport} onImprove={handleImprove} improving={improving} />
          <ImageManager images={options.images} onChange={(images) => setOptions({ ...options, images })} />
          <ExportPanel markdown={markdown} projectPath={projectPath} onSave={handleSave} />
        </aside>
      </div>
    </div>
  );
}
