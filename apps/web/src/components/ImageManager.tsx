import { useRef, useState } from "react";
import type { ImageAsset, ReadmeSectionKey } from "@readmeforge/core/browser";

interface ImageManagerProps {
  images: ImageAsset[];
  onChange: (images: ImageAsset[]) => void;
}

const PLACEMENT_OPTIONS: Array<{ value: ImageAsset["placement"]; label: string }> = [
  { value: "hero", label: "Hero (top)" },
  { value: "screenshots", label: "Screenshots" },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageManager({ images, onChange }: ImageManagerProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const additions: ImageAsset[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await fileToDataUrl(file);
      additions.push({
        id: `${Date.now()}-${file.name}`,
        fileName: file.name.replace(/\s+/g, "-"),
        altText: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        placement: images.length === 0 ? "hero" : "screenshots",
        dataUrl,
      });
    }
    onChange([...images, ...additions]);
  }

  function updateImage(id: string, patch: Partial<ImageAsset>) {
    onChange(images.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  }

  function removeImage(id: string) {
    onChange(images.filter((img) => img.id !== id));
  }

  return (
    <div className="card fade-in" style={{ padding: 18 }}>
      <div className="panel-heading" style={{ marginBottom: 10 }}>
        Screenshots &amp; Assets
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1px dashed ${dragging ? "var(--accent-purple)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-sm)",
          padding: "22px 12px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "color-mix(in srgb, var(--accent-purple) 6%, transparent)" : "transparent",
          transition: "all 0.12s ease",
          fontSize: 12.5,
          color: "var(--text-secondary)",
        }}
      >
        Drag &amp; drop images, or click to browse
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {images.map((img) => (
            <div key={img.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <img
                src={img.dataUrl}
                alt={img.altText}
                style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border-subtle)" }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <input
                  className="input"
                  style={{ height: 28, fontSize: 12 }}
                  value={img.altText}
                  placeholder="Alt text"
                  onChange={(e) => updateImage(img.id, { altText: e.target.value })}
                />
                <select
                  className="select"
                  value={img.placement}
                  onChange={(e) => updateImage(img.id, { placement: e.target.value as ReadmeSectionKey | "hero" })}
                >
                  {PLACEMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => removeImage(img.id)} aria-label={`Remove ${img.fileName}`}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
