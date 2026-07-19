"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { HERO_IMAGE_URL } from "@/src/landing/destinations";
import { parallaxOffset } from "@/src/landing/parallax";

type HeroParallaxProps = {
  children: React.ReactNode;
};

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export function HeroParallax({ children }: HeroParallaxProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    if (reducedMotion) {
      mediaRef.current?.style.setProperty("--parallax-y", "0px");
      return;
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const offset = parallaxOffset(window.scrollY);
        mediaRef.current?.style.setProperty("--parallax-y", `${offset}px`);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [reducedMotion]);

  return (
    <section
      className="landing-hero relative flex min-h-[360px] items-center justify-center overflow-hidden px-4 py-14 text-center text-white isolation-isolate sm:min-h-[420px] sm:py-[72px] sm:pb-[88px]"
      aria-label="Start planning"
    >
      <div
        ref={mediaRef}
        className="landing-hero__media absolute inset-x-0 -top-[12%] -bottom-[12%] -z-20 h-[124%] bg-[linear-gradient(180deg,rgba(15,23,42,0.25),rgba(15,23,42,0.45)),var(--hero-image)] bg-cover bg-center bg-no-repeat will-change-transform"
        style={
          {
            "--hero-image": `url("${HERO_IMAGE_URL}")`,
            "--parallax-y": "0px",
          } as React.CSSProperties
        }
        role="img"
        aria-label="Mountain landscape"
      />
      <div className="landing-hero__content relative z-10 w-full">{children}</div>
    </section>
  );
}
