import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const frontendRoot = resolve(import.meta.dirname, "..");
const repoRoot = resolve(frontendRoot, "..");
const storybookStatic = join(frontendRoot, "storybook-static");
const reportPath = join(repoRoot, "docs", "audits", "storybook-agy-ux-ui-review.md");
const agyBin = process.env.ANTIGRAVITY_CLI_BIN ?? "agy";

if (!existsSync(storybookStatic)) {
  run("bun", ["run", "build-storybook"], frontendRoot);
}

const prompt = [
  "You are auditing the Sagittarius Storybook UX/UI catalog.",
  "",
  "Context:",
  "- Product: group-trip planning cockpit, not a marketing site.",
  "- Visual system: reference-driven travel cockpit with warm white surfaces, orange primary actions, blue route context, and orange warnings.",
  "- Core UX: desktop-first cockpit, Smart Itinerary Table source of truth, responsive mobile/tablet behavior, bilingual English/Thai.",
  "",
  "Local artifacts:",
  `- Storybook static build: ${storybookStatic}`,
  "- Storybook source: frontend/src/**/*.stories.tsx",
  "- Preview config: frontend/.storybook/preview.ts",
  "- Contract: frontend/src/storybook/contracts/*.test.ts",
  "",
  "Audit tasks:",
  "1. Review the Storybook catalog coverage for UX/UI testing gaps.",
  "2. Check cockpit stories across 320, 768, 1024, and 1440 widths.",
  "3. Check role states: owner, traveler, viewer, dense, empty, Thai.",
  "4. Check itinerary path states: main, Plan A/Plan B alternatives, overlap stress, table overflow.",
  "5. Report only actionable gaps with file/story references and suggested verification.",
  "",
  "Output shape:",
  "- Findings ordered by severity.",
  "- Evidence from Storybook source or rendered static output.",
  "- Recommended Storybook story or play assertion for each gap.",
].join("\n");

const agy = spawnSync(
  agyBin,
  ["--add-dir", repoRoot, "-p", prompt, "--print-timeout", process.env.AGY_PRINT_TIMEOUT ?? "15m"],
  {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

mkdirSync(dirname(reportPath), { recursive: true });

const report = [
  "# Storybook AGY UX/UI Review",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Command: ${agyBin} --add-dir ${repoRoot} -p <storybook-ux-ui-prompt>`,
  "",
  "## Output",
  "",
  agy.stdout.trim() || "(no stdout)",
  "",
  "## Stderr",
  "",
  agy.stderr.trim() || "(no stderr)",
  "",
].join("\n");

writeFileSync(reportPath, report);

if (agy.status !== 0) {
  console.error(readFileSync(reportPath, "utf8"));
  process.exit(agy.status ?? 1);
}

console.log(`AGY Storybook UX/UI review written to ${reportPath}`);

function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
