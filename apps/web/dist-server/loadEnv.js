import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/**
 * Minimal .env loader (no dependency needed for a handful of KEY=VALUE lines).
 * Real environment variables always win over .env file values.
 */
export function loadEnvFile(fileName = ".env") {
    const envPath = path.resolve(__dirname, "..", fileName);
    let contents;
    try {
        contents = readFileSync(envPath, "utf-8");
    }
    catch {
        return;
    }
    for (const rawLine of contents.split("\n")) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#"))
            continue;
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!match)
            continue;
        const [, key, rawValue] = match;
        if (process.env[key] !== undefined)
            continue;
        process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
    }
}
