import { useEffect, useRef, useState } from "react";
import type { ProviderId } from "@readmeforge/core/browser";
import type { ProviderConfig, ProviderDescriptor } from "../lib/api.js";

interface ProviderSelectorProps {
  providers: ProviderDescriptor[];
  providerId: ProviderId;
  providerConfig: ProviderConfig;
  onChange: (providerId: ProviderId, config: ProviderConfig) => void;
}

export function ProviderSelector({ providers, providerId, providerConfig, onChange }: ProviderSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = providers.find((p) => p.id === providerId);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function updateKey(key: string) {
    if (providerId === "openai") onChange(providerId, { ...providerConfig, openai: { ...providerConfig.openai, apiKey: key } });
    if (providerId === "anthropic") onChange(providerId, { ...providerConfig, anthropic: { ...providerConfig.anthropic, apiKey: key } });
  }

  function updateCustomEndpoint(endpoint: string) {
    onChange(providerId, { ...providerConfig, custom: { ...providerConfig.custom, endpoint } });
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn btn-sm" onClick={() => setOpen((v) => !v)}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent-cyan)" }} />
        {current?.label ?? "AI Provider"}
      </button>

      {open && (
        <div
          className="card fade-in"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 300,
            padding: 12,
            zIndex: 40,
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <div className="panel-heading" style={{ marginBottom: 8 }}>
            AI Provider
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            {providers.map((p) => (
              <label key={p.id} className="checkbox-row" style={{ alignItems: "flex-start" }}>
                <input
                  type="radio"
                  name="provider"
                  checked={providerId === p.id}
                  onChange={() => onChange(p.id, providerConfig)}
                  style={{ marginTop: 2 }}
                />
                <span>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{p.description}</div>
                </span>
              </label>
            ))}
          </div>

          {(providerId === "openai" || providerId === "anthropic") && (
            <input
              className="input"
              type="password"
              placeholder="API key (kept in this browser only)"
              value={(providerId === "openai" ? providerConfig.openai?.apiKey : providerConfig.anthropic?.apiKey) ?? ""}
              onChange={(e) => updateKey(e.target.value)}
            />
          )}
          {providerId === "custom" && (
            <input
              className="input"
              placeholder="https://your-endpoint/v1/chat/completions"
              value={providerConfig.custom?.endpoint ?? ""}
              onChange={(e) => updateCustomEndpoint(e.target.value)}
            />
          )}
          {providerId === "local" && (
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
              Requires Ollama running locally at http://localhost:11434. Falls back to deterministic generation if unreachable.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
