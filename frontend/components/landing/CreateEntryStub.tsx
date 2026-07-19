type CreateEntryStubProps = {
  query: string;
  visible: boolean;
};

export function CreateEntryStub({ query, visible }: CreateEntryStubProps) {
  if (!visible) return null;

  const seed = query.trim();

  return (
    <section
      id="create"
      className="border-b border-(--color-border) bg-(--color-primary-soft) px-4 py-6"
      aria-label="Create trip entry"
    >
      <div className="mx-auto w-full max-w-[1120px]">
        <h2 className="m-0 text-lg font-bold text-(--color-text)">
          Ready to start planning
        </h2>
        <p className="mt-2 mb-0 max-w-prose text-sm leading-relaxed text-(--color-text-muted)">
          {seed
            ? `Your trip seed is “${seed}”. Sign-in and plan details come next — this public landing does not create a session yet.`
            : "Add a destination above to seed your trip. No sign-in required on this step."}
        </p>
      </div>
    </section>
  );
}
