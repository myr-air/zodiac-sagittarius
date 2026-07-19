export default function Home() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-(--color-page)">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_55%),radial-gradient(ellipse_at_90%_10%,color-mix(in_srgb,var(--color-route)_12%,transparent),transparent_50%),linear-gradient(180deg,var(--color-page),var(--color-surface-muted))]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,color-mix(in_srgb,var(--color-border)_70%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-border)_70%,transparent)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <p className="text-[1.75rem] font-bold tracking-tight text-(--color-text)">
          Joii
        </p>
        <nav className="flex items-center gap-3 text-sm font-semibold text-(--color-text-muted)">
          <span className="hidden sm:inline">EN</span>
          <a
            href="#login"
            className="rounded-(--radius-md) px-3 py-2 transition-colors hover:bg-(--color-surface) hover:text-(--color-text)"
          >
            Log in
          </a>
          <a
            href="#trip-access"
            className="rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text) transition-colors hover:border-(--color-primary-border) hover:bg-(--color-primary-soft)"
          >
            Trip access
          </a>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-5.5rem)] w-full max-w-5xl flex-col justify-center px-6 pb-16 pt-8">
        <p className="mb-4 text-5xl font-bold tracking-tight text-(--color-text) sm:text-6xl md:text-7xl">
          Joii
        </p>
        <h1 className="max-w-xl text-2xl font-semibold leading-snug text-(--color-text) sm:text-3xl">
          Plan group trips without losing the thread.
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-(--color-text-muted) sm:text-lg">
          A calm planning cockpit for shared itineraries, members, and trip
          decisions.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            id="login"
            href="#login"
            className="inline-flex items-center justify-center rounded-(--radius-md) bg-(--color-primary) px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-(--color-primary-strong)"
          >
            Log in
          </a>
          <a
            id="trip-access"
            href="#trip-access"
            className="inline-flex items-center justify-center rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) px-5 py-3 text-sm font-bold text-(--color-text) transition-colors hover:border-(--color-primary) hover:bg-(--color-primary-soft)"
          >
            Trip access
          </a>
        </div>
      </main>
    </div>
  );
}
