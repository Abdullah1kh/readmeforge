#!/usr/bin/env node
import path from "node:path";
import {
  analyzeProject,
  defaultReadmeOptions,
  generateDeterministicReadme,
  scoreReadme,
  renderScoreBar,
  saveReadmeToProject,
} from "@readmeforge/core";

const COMMANDS = ["analyze", "generate", "check", "preview"] as const;
type Command = (typeof COMMANDS)[number];

function printHelp() {
  console.log(`ReadmeForge CLI

Usage:
  readmeforge <path>              Analyze and generate a README (prints to stdout)
  readmeforge analyze <path>      Print detected project metadata as JSON
  readmeforge generate <path>     Generate a README and write it to <path>/README.md
  readmeforge check <path>        Score an existing README and print the report
  readmeforge preview <path>      Generate a README and print it to stdout

Options:
  --overwrite   Allow "generate" to overwrite an existing README.md
  --json        Print machine-readable JSON where applicable
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    return;
  }

  const overwrite = args.includes("--overwrite");
  const asJson = args.includes("--json");
  const positional = args.filter((a) => !a.startsWith("--"));

  let command: Command = "generate";
  let target = positional[0] ?? ".";

  if ((COMMANDS as readonly string[]).includes(positional[0])) {
    command = positional[0] as Command;
    target = positional[1] ?? ".";
  }

  const rootDir = path.resolve(target);

  switch (command) {
    case "analyze": {
      const project = await analyzeProject(rootDir);
      console.log(JSON.stringify(project, null, 2));
      break;
    }
    case "generate": {
      const project = await analyzeProject(rootDir);
      const markdown = generateDeterministicReadme(project, defaultReadmeOptions());
      const result = await saveReadmeToProject({ targetDir: rootDir, content: markdown, overwrite });
      if (!result.written) {
        console.error(`README.md already exists at ${result.path}. Re-run with --overwrite to replace it.`);
        process.exitCode = 1;
        break;
      }
      console.log(`README written to ${result.path}`);
      break;
    }
    case "preview": {
      const project = await analyzeProject(rootDir);
      const markdown = generateDeterministicReadme(project, defaultReadmeOptions());
      console.log(markdown);
      break;
    }
    case "check": {
      const project = await analyzeProject(rootDir);
      const markdown = project.existingReadmeContent ?? generateDeterministicReadme(project, defaultReadmeOptions());
      const report = scoreReadme(markdown);
      if (asJson) {
        console.log(JSON.stringify(report, null, 2));
        break;
      }
      console.log(`README QUALITY\n`);
      console.log(`${report.score} / 100`);
      console.log(renderScoreBar(report.score));
      console.log("");
      for (const cat of report.categories) {
        const icon = cat.present && !cat.weak ? "✓" : "⚠";
        console.log(`${icon} ${cat.message}`);
      }
      break;
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
