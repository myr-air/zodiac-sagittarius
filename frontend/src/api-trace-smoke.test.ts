import { describe, expect, it } from "vitest";

import { normalizeTraceOutput } from "../scripts/run-local-api-trace-smoke";

describe("api trace smoke log matching", () => {
  it("normalizes ANSI-colored tracing fields from GitHub Actions logs", () => {
    const output = normalizeTraceOutput(
      "\x1B[3mmethod\x1B[0m\x1B[2m=\x1B[0mPOST " +
        "\x1B[3muri\x1B[0m\x1B[2m=\x1B[0m/api/v1/trip-join-sessions " +
        "started processing request status\x1B[0m\x1B[2m=\x1B[0m200",
    );

    expect(output).toContain("method=POST");
    expect(output).toContain("uri=/api/v1/trip-join-sessions");
    expect(output).toContain("started processing request");
    expect(output).toContain("status=200");
  });
});
