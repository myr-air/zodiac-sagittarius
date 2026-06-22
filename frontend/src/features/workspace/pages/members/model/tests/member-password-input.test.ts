import { describe, expect, it } from "vitest";
import {
  buildMemberPasswordInput,
  memberPasswordMinLength,
} from "../member-password-input";

describe("member password input", () => {
  it("trims valid password input", () => {
    expect(buildMemberPasswordInput(" fresh-pin ")).toBe("fresh-pin");
  });

  it("returns null when input is shorter than the minimum length", () => {
    expect(buildMemberPasswordInput("123")).toBeNull();
    expect(buildMemberPasswordInput(" ".repeat(memberPasswordMinLength))).toBeNull();
  });

  it("centralizes the minimum member password length", () => {
    expect(memberPasswordMinLength).toBe(4);
    expect(buildMemberPasswordInput("1".repeat(memberPasswordMinLength))).toBe(
      "1".repeat(memberPasswordMinLength),
    );
  });
});
