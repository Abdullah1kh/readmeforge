import type {
  AnalyzeProgressEvent,
  ProjectInfo,
  ProviderId,
  QualityReport,
  ReadmeGenerationOptions,
} from "@readmeforge/core/browser";

export interface ProviderDescriptor {
  id: ProviderId;
  label: string;
  requiresApiKey: boolean;
  description: string;
}

export interface ProviderConfig {
  local?: { baseUrl?: string; model?: string };
  openai?: { apiKey: string; model?: string };
  anthropic?: { apiKey: string; model?: string };
  custom?: { endpoint: string; apiKey?: string; model?: string };
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed with ${res.status}`);
  }
  return res.json();
}

export async function pickFolder(): Promise<string> {
  const res = await fetch("/api/pick-folder");
  const data = await json<{ path: string }>(res);
  return data.path;
}

export function analyzeStream(
  path: string,
  onProgress: (event: AnalyzeProgressEvent) => void
): Promise<ProjectInfo> {
  return new Promise((resolve, reject) => {
    const source = new EventSource(`/api/analyze-stream?path=${encodeURIComponent(path)}`);
    source.addEventListener("progress", (e) => {
      onProgress(JSON.parse((e as MessageEvent).data));
    });
    source.addEventListener("done", (e) => {
      const project = JSON.parse((e as MessageEvent).data);
      source.close();
      resolve(project);
    });
    source.addEventListener("error", (e) => {
      source.close();
      const data = (e as MessageEvent).data;
      reject(new Error(data ? JSON.parse(data).message : "Analysis failed"));
    });
  });
}

export async function fetchProviders(): Promise<ProviderDescriptor[]> {
  const res = await fetch("/api/providers");
  return json(res);
}

export async function checkProvider(providerId: ProviderId, providerConfig: ProviderConfig): Promise<boolean> {
  const res = await fetch("/api/providers/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerId, providerConfig }),
  });
  const data = await json<{ available: boolean }>(res);
  return data.available;
}

export async function generateReadme(
  project: ProjectInfo,
  options: ReadmeGenerationOptions,
  providerId: ProviderId,
  providerConfig: ProviderConfig
): Promise<{ markdown: string; usedProvider: string }> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, options, providerId, providerConfig }),
  });
  return json(res);
}

export async function improveReadme(
  current: string,
  project: ProjectInfo,
  weakAreas: string[],
  providerId: ProviderId,
  providerConfig: ProviderConfig
): Promise<{ markdown: string }> {
  const res = await fetch("/api/improve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current, project, weakAreas, providerId, providerConfig }),
  });
  return json(res);
}

export async function scoreReadmeRemote(markdown: string): Promise<QualityReport> {
  const res = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown }),
  });
  return json(res);
}

export async function saveReadme(
  targetDir: string,
  content: string,
  overwrite: boolean
): Promise<{ written: boolean; path: string; existedAlready: boolean }> {
  const res = await fetch("/api/save-readme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetDir, content, overwrite }),
  });
  return json(res);
}

export async function saveAssets(
  targetDir: string,
  images: Array<{ fileName: string; dataUrl: string }>
): Promise<string[]> {
  const res = await fetch("/api/save-assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetDir, images }),
  });
  const data = await json<{ written: string[] }>(res);
  return data.written;
}

export async function analyzeGitHub(url: string): Promise<ProjectInfo> {
  const res = await fetch("/api/github/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await json<{ project: ProjectInfo }>(res);
  return data.project;
}

export async function fetchChangelog(path: string): Promise<string> {
  const res = await fetch("/api/git/changelog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  const data = await json<{ changelog: string }>(res);
  return data.changelog;
}

export async function fetchCommitMessage(path: string): Promise<string> {
  const res = await fetch("/api/git/commit-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  const data = await json<{ message: string }>(res);
  return data.message;
}
