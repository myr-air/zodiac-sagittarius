import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectStoryFiles,
  readProjectFile,
  storyText,
} from "./storybook.contract.test-support";

describe("Storybook QA and support contracts", () => {
  it("keeps viewport and antigravity UX QA entry points available", () => {
    const preview = readProjectFile(".storybook", "preview.ts");
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const stories = storyText();

    ["mobile320", "tablet768", "desktop1024", "desktop1440"].forEach(
      (viewportName) => {
        expect(preview).toContain(viewportName);
      },
    );
    expect(stories).not.toContain('defaultViewport: "mobile1"');
    expect(packageJson.scripts?.["test:storybook:agy"]).toBe(
      "bun run scripts/run-storybook-agy-ux-qa.ts",
    );
    expect(existsSync(join("scripts", "run-storybook-agy-ux-qa.ts"))).toBe(true);
    expect(existsSync(join("..", "docs", "storybook-ux-ui-qa.md"))).toBe(true);
  });

  it("wraps stories in bilingual i18n controls with English as the default", () => {
    const preview = readProjectFile(".storybook", "preview.ts");
    const stories = storyText();

    expect(preview).toContain("I18nProvider");
    expect(preview).toContain("globalTypes");
    expect(preview).toContain("defaultValue: defaultLocale");
    expect(stories).toContain('parameters: { locale: "th" }');
  });

  it("keeps repeated story callback placeholders centralized", () => {
    const localNoopDefinitions = collectStoryFiles().flatMap((file) => {
      const story = readProjectFile(file);
      return [
        ...story.matchAll(/const noop = (?:async )?\(\) => \{\};/g),
      ].map((match) => `${file}:${match.index ?? 0}`);
    });

    expect(localNoopDefinitions).toEqual([]);
    expect(readProjectFile("src", "testing", "storybook-actions.ts")).toContain(
      "export function noop",
    );
  });
});
