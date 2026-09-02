import express from "express";
import cors from "cors";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadEnvFile } from "./loadEnv.js";
import {
  analyzeProject,
  ANALYSIS_STEPS,
  generateDeterministicReadme,
  scoreReadme,
  saveReadmeToProject,
  saveAssetsToProject,
  analyzeGitHubRepo,
  generateChangelog,
  suggestCommitMessage,
  createProvider,
  AVAILABLE_PROVIDERS,
  type ProviderId,
  type ReadmeGenerationOptions,
} from "@readmeforge/core";

loadEnvFile();

const execFileAsync = promisify(execFile);
const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

const DEFAULT_PORT = 4783;
const PORT = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT;

if (Number.isNaN(PORT)) {
  console.error(`Invalid PORT value: "${process.env.PORT}". PORT must be a number.`);
  process.exit(1);
}

// --- Folder picker (native macOS dialog via AppleScript; no path is ever guessed) ---
app.get("/api/pick-folder", async (_req, res) => {
  if (process.platform !== "darwin") {
    res.status(501).json({ error: "Native folder picker is only implemented for macOS. Paste a path instead." });
    return;
  }
  try {
    const script = 'POSIX path of (choose folder with prompt "Select a project folder")';
    const { stdout } = await execFileAsync("osascript", ["-e", script], { timeout: 60_000 });
    const folderPath = stdout.trim();
    if (!folderPath) {
      res.status(400).json({ error: "No folder selected" });
      return;
    }
    res.json({ path: folderPath });
  } catch {
    res.status(400).json({ error: "Folder selection cancelled" });
  }
});

// --- Analysis (Server-Sent Events for the progress screen) ---
app.get("/api/analyze-stream", async (req, res) => {
  const dir = String(req.query.path ?? "");
  if (!dir) {
    res.status(400).end();
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const project = await analyzeProject(dir, (progress) => {
      send("progress", progress);
    });
    send("done", project);
  } catch (err) {
    send("error", { message: err instanceof Error ? err.message : "Analysis failed" });
  } finally {
    res.end();
  }
});

app.get("/api/analysis-steps", (_req, res) => {
  res.json(ANALYSIS_STEPS);
});

// --- Generation ---
app.post("/api/generate", async (req, res) => {
  const { project, options, providerId, providerConfig } = req.body as {
    project: any;
    options: ReadmeGenerationOptions;
    providerId: ProviderId;
    providerConfig: any;
  };
  try {
    const provider = createProvider(providerId ?? "none", providerConfig ?? {});
    const available = await provider.isAvailable();
    const markdown = available
      ? await provider.generateReadme({ project, options })
      : generateDeterministicReadme(project, options);
    res.json({ markdown, usedProvider: available ? provider.id : "none" });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Generation failed" });
  }
});

app.post("/api/improve", async (req, res) => {
  const { current, project, weakAreas, providerId, providerConfig } = req.body as {
    current: string;
    project: any;
    weakAreas: string[];
    providerId: ProviderId;
    providerConfig: any;
  };
  try {
    const provider = createProvider(providerId ?? "none", providerConfig ?? {});
    const available = await provider.isAvailable();
    if (!available) {
      res.status(400).json({ error: "Selected AI provider is unavailable. Choose a configured provider to improve the README." });
      return;
    }
    const markdown = await provider.improveReadme(current, project, weakAreas);
    res.json({ markdown });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Improvement failed" });
  }
});

app.get("/api/providers", async (_req, res) => {
  res.json(AVAILABLE_PROVIDERS);
});

app.post("/api/providers/check", async (req, res) => {
  const { providerId, providerConfig } = req.body as { providerId: ProviderId; providerConfig: any };
  try {
    const provider = createProvider(providerId ?? "none", providerConfig ?? {});
    const available = await provider.isAvailable();
    res.json({ available });
  } catch (err) {
    res.json({ available: false, error: err instanceof Error ? err.message : "Provider check failed" });
  }
});

// --- Quality ---
app.post("/api/score", (req, res) => {
  const { markdown } = req.body as { markdown: string };
  res.json(scoreReadme(markdown ?? ""));
});

// --- Export ---
app.post("/api/save-readme", async (req, res) => {
  const { targetDir, content, overwrite } = req.body as { targetDir: string; content: string; overwrite?: boolean };
  try {
    const result = await saveReadmeToProject({ targetDir, content, overwrite });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Save failed" });
  }
});

app.post("/api/save-assets", async (req, res) => {
  const { targetDir, images } = req.body as { targetDir: string; images: Array<{ fileName: string; dataUrl: string }> };
  try {
    const written = await saveAssetsToProject(targetDir, images);
    res.json({ written });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Asset save failed" });
  }
});

// --- GitHub import ---
app.post("/api/github/analyze", async (req, res) => {
  const { url } = req.body as { url: string };
  try {
    const project = await analyzeGitHubRepo(url);
    res.json({ project });
  } catch (err: any) {
    res.status(err?.code === "not-found" ? 404 : 400).json({ error: err?.message ?? "GitHub analysis failed" });
  }
});

// --- Git integration ---
app.post("/api/git/changelog", async (req, res) => {
  const { path: dir } = req.body as { path: string };
  try {
    res.json({ changelog: await generateChangelog(dir) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Changelog generation failed" });
  }
});

app.post("/api/git/commit-message", async (req, res) => {
  const { path: dir } = req.body as { path: string };
  try {
    res.json({ message: await suggestCommitMessage(dir) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Commit message generation failed" });
  }
});

const server = app.listen(PORT, () => {
  console.log(`ReadmeForge server listening on http://localhost:${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      [
        "",
        `Port ${PORT} is already in use — ReadmeForge's API server could not start.`,
        "",
        "Fix this by either:",
        `  1. Stopping whatever is using port ${PORT} (e.g. \`lsof -i :${PORT}\` to find it), or`,
        `  2. Starting ReadmeForge on a different port:`,
        `       PORT=4784 npm run dev`,
        "     (update apps/web/.env or apps/web/.env.local to make this permanent — see apps/web/.env.example)",
        "",
        "The frontend dev server reads the same PORT value to proxy /api requests, so both must agree.",
        "",
      ].join("\n")
    );
    process.exit(1);
  }
  throw err;
});
