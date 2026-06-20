import { describe, expect, it } from "vitest";
import { runEmailLoginSubmission } from "./email-login-submit-runner";

describe("runEmailLoginSubmission", () => {
  it("wraps successful submissions with submitting state", async () => {
    const states: boolean[] = [];

    const result = await runEmailLoginSubmission({
      onError: () => {
        throw new Error("unexpected error");
      },
      run: async () => "ok",
      setIsSubmitting: (isSubmitting) => states.push(isSubmitting),
    });

    expect(result).toBe("ok");
    expect(states).toEqual([true, false]);
  });

  it("clears submitting state when the submission fails", async () => {
    const errors: unknown[] = [];
    const states: boolean[] = [];

    const result = await runEmailLoginSubmission({
      onError: (caught) => errors.push(caught),
      run: async () => {
        throw new Error("failed");
      },
      setIsSubmitting: (isSubmitting) => states.push(isSubmitting),
    });

    expect(result).toBeUndefined();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(Error);
    expect(states).toEqual([true, false]);
  });
});
