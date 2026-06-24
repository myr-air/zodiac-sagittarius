type QueuedUpdate = () => void | Promise<void>;

export async function queueKeyedUpdate(
  queue: Map<string, Promise<void>>,
  key: string,
  update: QueuedUpdate,
) {
  const previousUpdate = queue.get(key) ?? Promise.resolve();
  const queuedUpdate = previousUpdate
    .catch(() => undefined)
    .then(() => update());
  queue.set(key, queuedUpdate);
  try {
    await queuedUpdate;
  } finally {
    if (queue.get(key) === queuedUpdate) {
      queue.delete(key);
    }
  }
}
