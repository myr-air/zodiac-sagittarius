"use client";

import { authChrome } from "@/src/auth/auth-chrome";
import { tripAccessShell } from "@/src/auth/trip-access";
import { AuthLocaleProvider, useAuthLocale } from "./AuthLocaleProvider";
import { LocaleSwitch } from "./LocaleSwitch";

const MOSAIC_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
] as const;

const MOBILE_HERO =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80";

function TripAccessShellInner({ children }: { children: React.ReactNode }) {
  const shell = tripAccessShell();
  const chrome = authChrome();
  const { locale, copy } = useAuthLocale();
  const colTemplate = shell.media.columns.map((n) => `${n}fr`).join(" ");
  const rowTemplate = shell.media.rows.map((n) => `${n}fr`).join(" ");
  const motionClass = chrome.motion.transitionClassName;
  const railClass = "mx-auto flex w-full max-w-[377px] flex-col";

  return (
    <div
      className="auth-shell grid h-dvh w-full grid-cols-1 overflow-hidden bg-(--color-page) min-[960px]:grid-cols-[minmax(340px,1fr)_minmax(480px,1.618fr)]"
      data-shell={shell.shell}
      data-trip-media={chrome.layout.tripMedia}
      data-mobile-stack={chrome.layout.mobileStackOrder.join(",")}
      data-locale={locale}
    >
      <div className="flex h-dvh min-h-0 flex-col overflow-y-auto overscroll-contain bg-(--color-surface)">
        <div
          className="relative h-[180px] w-full shrink-0 overflow-hidden min-[960px]:hidden"
          data-auth-media="mobile"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-cover bg-[position:61.8%_38.2%]"
            style={{ backgroundImage: `url('${MOBILE_HERO}')` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.4))]" />
        </div>

        <div className={`${railClass} flex-1 px-5 py-8`}>
          <header className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="grid size-[34px] place-items-center rounded-[8px] bg-(--color-primary) text-(--color-on-primary)"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className="size-5"
                >
                  <path d="M4 12h16M12 4l8 8-8 8" />
                </svg>
              </span>
              <p className="m-0 text-[1.3125rem] font-bold leading-none tracking-[-0.02em] text-(--color-text)">
                {shell.brand}
              </p>
            </div>
            <LocaleSwitch />
          </header>

          <div className="mt-8 w-full">{children}</div>

          <a
            href={chrome.crossLinks.home.href}
            className={`mt-8 inline-flex min-h-[34px] w-full items-center justify-center gap-2 text-[0.8125rem] font-bold text-(--color-text-muted) hover:text-(--color-primary-strong) ${motionClass}`}
          >
            {copy.backHome}
          </a>
        </div>
      </div>

      <aside
        className="relative hidden h-dvh min-h-0 overflow-hidden bg-[#0b1220] min-[960px]:block"
        data-auth-media="desktop"
        aria-label={shell.media.ariaLabel}
      >
        <div
          className="absolute inset-5 z-1 grid gap-3"
          style={{
            gridTemplateColumns: colTemplate,
            gridTemplateRows: rowTemplate,
          }}
          aria-hidden="true"
        >
          {MOSAIC_IMAGES.map((src, index) => (
            <figure
              key={src}
              className={`m-0 overflow-hidden rounded-[21px] border border-white/18 shadow-[0_13px_34px_rgba(15,23,42,0.1)] ${
                index === 0 ? "row-span-2" : ""
              } ${index === 3 ? "col-span-2" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="block h-full w-full object-cover"
              />
            </figure>
          ))}
        </div>
        <div className="absolute right-8 bottom-8 left-8 z-2 max-w-[min(34ch,calc(100%*0.382+12ch))] rounded-[21px] bg-[rgba(15,23,42,0.55)] p-5 text-white backdrop-blur-[8px]">
          <h2 className="m-0 mb-2 text-[1.618rem] font-bold leading-[1.1]">
            {copy.trip.mediaTitle}
          </h2>
          <p className="m-0 text-[0.8125rem] leading-[1.618] text-white/88">
            {copy.trip.mediaCopy}
          </p>
        </div>
      </aside>
    </div>
  );
}

export function TripAccessShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthLocaleProvider>
      <TripAccessShellInner>{children}</TripAccessShellInner>
    </AuthLocaleProvider>
  );
}
