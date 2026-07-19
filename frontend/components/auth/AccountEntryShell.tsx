"use client";

import { useEffect, useState } from "react";
import {
  accountEntryShellForRoute,
  type AccountEntryRoute,
} from "@/src/auth/account-entry-shell";
import { authChrome } from "@/src/auth/auth-chrome";
import { AuthLocaleProvider, useAuthLocale } from "./AuthLocaleProvider";
import { LocaleSwitch } from "./LocaleSwitch";

const GALLERY_SRC = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1800&q=80",
] as const;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(authChrome().motion.reducedMotionQuery).matches;
}

function AccountEntryShellInner({
  route,
  children,
}: {
  route: AccountEntryRoute;
  children: React.ReactNode;
}) {
  const shell = accountEntryShellForRoute(route);
  const chrome = authChrome();
  const { locale, copy } = useAuthLocale();
  const [slide, setSlide] = useState(0);
  const activeHref = route === "/login" ? "/login" : "/register";
  const motionClass = chrome.motion.transitionClassName;
  const railClass = "mx-auto flex w-full max-w-[377px] flex-col";

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setSlide((current) => (current + 1) % GALLERY_SRC.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="auth-shell grid h-dvh w-full grid-cols-1 overflow-hidden bg-(--color-page) min-[960px]:grid-cols-[minmax(340px,1fr)_minmax(480px,1.618fr)]"
      data-shell={shell.shell}
      data-mobile-stack={chrome.layout.mobileStackOrder.join(",")}
      data-desktop-min={chrome.layout.desktopMinPx}
      data-locale={locale}
    >
      {/* Left: scrollable form panel only */}
      <div className="flex h-dvh min-h-0 flex-col overflow-y-auto overscroll-contain bg-(--color-surface)">
        <div
          className="relative h-[clamp(144px,38.2vw,233px)] w-full shrink-0 overflow-hidden min-[960px]:hidden"
          data-auth-media="mobile"
          aria-hidden="true"
        >
          {GALLERY_SRC.map((src, index) => (
            <div
              key={src}
              className={`auth-slide absolute inset-0 bg-cover bg-[position:61.8%_38.2%] ${
                index === slide ? "opacity-100" : "opacity-0"
              } ${motionClass}`}
              style={{ backgroundImage: `url('${src}')` }}
            />
          ))}
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

          <nav
            className="mt-8 mb-4 grid w-full grid-cols-2 border-b border-(--color-border)"
            aria-label="Account access"
          >
            <a
              href="/login"
              aria-current={activeHref === "/login" ? "page" : undefined}
              className={`-mb-px grid min-h-14 place-items-center border-b-[3px] text-center text-sm font-bold ${motionClass} ${
                activeHref === "/login"
                  ? "border-(--color-primary) text-(--color-primary-strong)"
                  : "border-transparent text-(--color-text-muted)"
              }`}
            >
              {copy.tabs.signIn}
            </a>
            <a
              href="/register"
              aria-current={activeHref === "/register" ? "page" : undefined}
              className={`-mb-px grid min-h-14 place-items-center border-b-[3px] text-center text-sm font-bold ${motionClass} ${
                activeHref === "/register"
                  ? "border-(--color-primary) text-(--color-primary-strong)"
                  : "border-transparent text-(--color-text-muted)"
              }`}
            >
              {copy.tabs.register}
            </a>
          </nav>

          <div className="w-full">{children}</div>

          <a
            href={chrome.crossLinks.home.href}
            className={`mt-8 inline-flex min-h-[34px] w-full items-center justify-center gap-2 text-[0.8125rem] font-bold text-(--color-text-muted) hover:text-(--color-primary-strong) ${motionClass}`}
          >
            {copy.backHome}
          </a>
        </div>
      </div>

      {/* Right: full-height media, no page scroll */}
      <aside
        className="relative hidden h-dvh min-h-0 overflow-hidden bg-[#0f172a] min-[960px]:block"
        data-auth-media="desktop"
        aria-label="Travel imagery"
      >
        {GALLERY_SRC.map((src, index) => (
          <div
            key={src}
            className={`auth-slide absolute inset-0 bg-cover bg-[position:61.8%_38.2%] ${
              index === slide ? "opacity-100" : "opacity-0"
            } ${motionClass}`}
            style={{ backgroundImage: `url('${src}')` }}
            aria-hidden={index !== slide}
          />
        ))}
        <div className="absolute inset-0 z-1 bg-[linear-gradient(180deg,rgba(15,23,42,0.12)_0%,rgba(15,23,42,0.42)_61.8%,rgba(15,23,42,0.78)_100%),linear-gradient(90deg,rgba(15,23,42,0.22),transparent_38.2%)]" />
        <div
          className="absolute top-[38.2%] right-[34px] z-2 grid w-[89px] -translate-y-1/2 gap-[13px]"
          role="group"
          aria-label="Image thumbnails"
        >
          {GALLERY_SRC.map((src, index) => (
            <button
              key={src}
              type="button"
              aria-current={index === slide}
              aria-label={`Slide ${index + 1}`}
              onClick={() => setSlide(index)}
              className={`h-[55px] w-[89px] overflow-hidden rounded-(--radius-md) border-2 p-0 shadow-[0_13px_34px_rgba(15,23,42,0.1)] ${motionClass} ${
                index === slide
                  ? "-translate-x-2 border-white opacity-100"
                  : "border-transparent opacity-[0.82]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="block size-full object-cover" />
            </button>
          ))}
        </div>
        <div className="absolute bottom-[55px] left-[34px] right-[123px] z-2 max-w-[min(34ch,calc(100%*0.382+12ch))] text-white">
          <h2 className="m-0 mb-3 text-[clamp(1.618rem,2.6vw,2.618rem)] font-bold leading-[1.1]">
            {copy.gallery[slide]?.title}
          </h2>
          <p className="m-0 max-w-[28ch] text-sm leading-[1.618] text-white/88">
            {copy.gallery[slide]?.copy}
          </p>
        </div>
        <div
          className="absolute bottom-[34px] left-[34px] z-2 flex items-center gap-2"
          aria-label="Carousel pages"
        >
          {GALLERY_SRC.map((src, index) => (
            <button
              key={src}
              type="button"
              aria-current={index === slide}
              aria-label={`Slide ${index + 1}`}
              onClick={() => setSlide(index)}
              className={`h-2 rounded-full border-0 p-0 ${motionClass} ${
                index === slide ? "w-[21px] bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}

export function AccountEntryShell({
  route,
  children,
}: {
  route: AccountEntryRoute;
  children: React.ReactNode;
}) {
  return (
    <AuthLocaleProvider>
      <AccountEntryShellInner route={route}>{children}</AccountEntryShellInner>
    </AuthLocaleProvider>
  );
}
