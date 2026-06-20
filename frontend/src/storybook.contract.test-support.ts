import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";

export function collectStoryFiles(dir = "src"): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectStoryFiles(path);
    return entry.isFile() && entry.name.endsWith(".stories.tsx") ? [path] : [];
  });
}

export function readProjectFile(...pathParts: string[]): string {
  return readFileSync(join(...pathParts), "utf8");
}

export function storyText() {
  return collectStoryFiles().map((file) => readProjectFile(file)).join("\n");
}

export function expectStoryExports(file: string, stateNames: string[]) {
  const story = readProjectFile("src", file);

  stateNames.forEach((stateName) => {
    expect(story, `${file} should export ${stateName}`).toContain(
      `export const ${stateName}`,
    );
  });
}
