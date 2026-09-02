import type { ReadmeAudience, ReadmeGenerationOptions, ReadmeLength, ReadmeSectionKey, ReadmeStyle } from "@readmeforge/core/browser";

const SECTION_LABELS: Record<ReadmeSectionKey, string> = {
  overview: "Overview",
  features: "Features",
  installation: "Installation",
  usage: "Usage",
  configuration: "Configuration",
  environmentVariables: "Environment Variables",
  architecture: "Architecture",
  api: "API",
  screenshots: "Screenshots",
  contributing: "Contributing",
  license: "License",
};

const STYLE_OPTIONS: ReadmeStyle[] = ["professional", "technical", "minimal", "open-source", "startup"];
const LENGTH_OPTIONS: ReadmeLength[] = ["compact", "standard", "detailed"];
const AUDIENCE_OPTIONS: ReadmeAudience[] = ["developers", "end-users", "contributors", "technical-reviewers"];

interface ControlsPanelProps {
  options: ReadmeGenerationOptions;
  onChange: (options: ReadmeGenerationOptions) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

function labelize(s: string): string {
  return s
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function ControlsPanel({ options, onChange, onRegenerate, isGenerating }: ControlsPanelProps) {
  function toggleSection(key: ReadmeSectionKey) {
    onChange({ ...options, sections: { ...options.sections, [key]: !options.sections[key] } });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "20px 16px", overflowY: "auto", height: "100%" }} className="scrollbar-thin">
      <section>
        <div className="panel-heading" style={{ marginBottom: 10 }}>
          Content
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {(Object.keys(SECTION_LABELS) as ReadmeSectionKey[]).map((key) => (
            <label key={key} className="checkbox-row">
              <input type="checkbox" checked={options.sections[key]} onChange={() => toggleSection(key)} />
              <span style={{ fontSize: 13 }}>{SECTION_LABELS[key]}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <div className="panel-heading" style={{ marginBottom: 10 }}>
          Style
        </div>
        <div className="chip-group">
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style}
              className={`chip ${options.style === style ? "active" : ""}`}
              onClick={() => onChange({ ...options, style })}
            >
              {labelize(style)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="panel-heading" style={{ marginBottom: 10 }}>
          Length
        </div>
        <div className="chip-group">
          {LENGTH_OPTIONS.map((length) => (
            <button
              key={length}
              className={`chip ${options.length === length ? "active" : ""}`}
              onClick={() => onChange({ ...options, length })}
            >
              {labelize(length)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="panel-heading" style={{ marginBottom: 10 }}>
          Audience
        </div>
        <div className="chip-group">
          {AUDIENCE_OPTIONS.map((audience) => (
            <button
              key={audience}
              className={`chip ${options.audience === audience ? "active" : ""}`}
              onClick={() => onChange({ ...options, audience })}
            >
              {labelize(audience)}
            </button>
          ))}
        </div>
      </section>

      <button className="btn btn-primary" style={{ width: "100%", height: 40 }} onClick={onRegenerate} disabled={isGenerating}>
        {isGenerating ? "Generating…" : "Regenerate README"}
      </button>
    </div>
  );
}
