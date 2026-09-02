import { useEffect, useRef, useState } from "react";

let mermaidPromise: Promise<typeof import("mermaid")["default"]> | null = null;
function loadMermaid() {
  if (!mermaidPromise) mermaidPromise = import("mermaid").then((m) => m.default);
  return mermaidPromise;
}

let idCounter = 0;

export function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const id = useRef(`mermaid-${idCounter++}`);

  useEffect(() => {
    let cancelled = false;
    loadMermaid()
      .then(async (mermaid) => {
        mermaid.initialize({ startOnLoad: false, theme: "dark", themeVariables: { fontFamily: "var(--font-sans)" } });
        try {
          const { svg } = await mermaid.render(id.current, code);
          if (!cancelled && ref.current) ref.current.innerHTML = svg;
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : "Failed to render diagram");
        }
      })
      .catch(() => setError("Mermaid failed to load"));
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <pre style={{ color: "var(--accent-red)", fontSize: 12 }}>
        Diagram error: {error}
      </pre>
    );
  }

  return <div ref={ref} style={{ display: "flex", justifyContent: "center", margin: "16px 0" }} />;
}
