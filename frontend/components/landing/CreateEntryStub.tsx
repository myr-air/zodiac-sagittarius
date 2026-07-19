"use client";

type CreateEntryStubProps = {
  query: string;
  visible: boolean;
  busy?: boolean;
  error?: string | null;
};

export function CreateEntryStub({
  query,
  visible,
  busy = false,
  error = null,
}: CreateEntryStubProps) {
  if (!visible) return null;

  const seed = query.trim();

  return (
    <section
      id="create"
      className="border-b border-(--color-border) bg-(--color-primary-soft) px-4 py-6"
      aria-label="Create trip entry"
      aria-busy={busy || undefined}
    >
      <div className="mx-auto w-full max-w-[1120px]">
        <h2 className="m-0 text-lg font-bold text-(--color-text)">
          {busy ? "Creating your trip" : "Ready to start planning"}
        </h2>
        <p className="mt-2 mb-0 max-w-prose text-sm leading-relaxed text-(--color-text-muted)">
          {busy
            ? seed
              ? `Creating a trip for “${seed}”…`
              : "Creating your trip…"
            : seed
              ? `Your trip seed is “${seed}”. No sign-in required — we’ll open the trip when it’s ready.`
              : "Add a destination above to seed your trip. No sign-in required on this step."}
        </p>
        {error ? (
          <p
            role="alert"
            className="mt-3 mb-0 max-w-prose text-sm font-medium text-(--color-danger)"
          >
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
