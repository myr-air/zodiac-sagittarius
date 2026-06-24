import { describe, expect, it } from "vitest";
import { createDeferred } from "./deferred";

describe("createDeferred", () => {
  it("exposes resolve for controlled async test flow", async () => {
    const deferred = createDeferred<string>();

    deferred.resolve("done");

    await expect(deferred.promise).resolves.toBe("done");
  });

  it("exposes reject for controlled async failure flow", async () => {
    const deferred = createDeferred<string>();
    const error = new Error("failed");

    deferred.reject(error);

    await expect(deferred.promise).rejects.toBe(error);
  });
});
