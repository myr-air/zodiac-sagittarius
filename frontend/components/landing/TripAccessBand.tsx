export function TripAccessBand() {
  return (
    <section
      className="landing-reveal mt-12 border-y border-[#ccfbf1] bg-(--color-primary-soft) py-10"
      id="trip-access"
    >
      <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-6 px-4">
        <div>
          <h2 className="m-0 mb-2 text-2xl font-bold text-(--color-text)">
            Already have a trip?
          </h2>
          <p className="m-0 max-w-[42ch] text-sm leading-normal text-(--color-text-muted)">
            Join with a trip access code — no app store required. Joii is the web
            planning cockpit for your group.
          </p>
        </div>
        <a
          href="/trip-access"
          className="landing-control inline-flex min-h-11 items-center justify-center rounded-(--radius-md) bg-(--color-primary) px-5 text-[13px] font-bold text-(--color-on-primary) transition-colors duration-[180ms] hover:bg-(--color-primary-strong)"
        >
          Trip access
        </a>
      </div>
    </section>
  );
}
