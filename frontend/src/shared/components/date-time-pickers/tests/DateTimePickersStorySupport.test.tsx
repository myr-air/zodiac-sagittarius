import { describe, expect, it } from "vitest";
import { pickerKindValues } from "../storybook/DateTimePickers.stories.support";

describe("DateTimePickers story support", () => {
  it("keeps picker kinds in story display order", () => {
    expect(pickerKindValues).toEqual(["date", "time", "datetime"]);
  });
});
