import { describe, expect, it } from "vitest";
import { queueKeyedUpdate } from "./queued-updates";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

async function flushQueuedUpdateStart() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("queueKeyedUpdate", () => {
  it("serializes updates for the same key and cleans the queue", async () => {
    const queue = new Map<string, Promise<void>>();
    const firstGate = deferred();
    const events: string[] = [];

    const firstUpdate = queueKeyedUpdate(queue, "item-1", async () => {
      events.push("first-start");
      await firstGate.promise;
      events.push("first-end");
    });
    const secondUpdate = queueKeyedUpdate(queue, "item-1", () => {
      events.push("second");
    });

    await flushQueuedUpdateStart();
    expect(events).toEqual(["first-start"]);

    firstGate.resolve();
    await Promise.all([firstUpdate, secondUpdate]);

    expect(events).toEqual(["first-start", "first-end", "second"]);
    expect(queue.size).toBe(0);
  });

  it("runs different keys without waiting on each other", async () => {
    const queue = new Map<string, Promise<void>>();
    const firstGate = deferred();
    const events: string[] = [];

    const firstUpdate = queueKeyedUpdate(queue, "item-1", async () => {
      events.push("first-start");
      await firstGate.promise;
      events.push("first-end");
    });
    const secondUpdate = queueKeyedUpdate(queue, "item-2", () => {
      events.push("second");
    });

    await secondUpdate;
    expect(events).toEqual(["first-start", "second"]);

    firstGate.resolve();
    await firstUpdate;
    expect(queue.size).toBe(0);
  });

  it("does not block a queued follow-up when the previous update fails", async () => {
    const queue = new Map<string, Promise<void>>();
    const events: string[] = [];

    const failingUpdate = queueKeyedUpdate(queue, "item-1", async () => {
      throw new Error("failed update");
    });
    const nextUpdate = queueKeyedUpdate(queue, "item-1", () => {
      events.push("next");
    });

    await expect(failingUpdate).rejects.toThrow("failed update");
    await nextUpdate;

    expect(events).toEqual(["next"]);
    expect(queue.size).toBe(0);
  });
});
