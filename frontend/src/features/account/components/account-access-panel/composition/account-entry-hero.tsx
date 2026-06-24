"use client";

import Image from "next/image";
import type { Messages } from "@/src/i18n/messages";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { AuthFlow } from "../auth";

const accountAuthHighlightsClassName =
  "account-auth-highlights absolute bottom-[76px] left-11 z-[2] col-span-full grid w-[330px] list-none gap-[18px] self-end border-t-0 p-0 m-[clamp(24px,7vh,64px)_0_0] max-[767px]:relative max-[767px]:inset-auto max-[767px]:w-auto max-[767px]:gap-3 max-[767px]:mt-[18px]";
const accountAuthHighlightClassName =
  "account-auth-highlight grid min-h-[54px] grid-cols-[42px_minmax(0,1fr)] items-start gap-3.5 border-b-0 bg-transparent p-0 text-(--color-text) max-[767px]:min-h-0 [&_.icon]:size-8 [&_.icon]:rounded-full [&_.icon]:border-2 [&_.icon]:border-current [&_.icon]:p-[5px] [&_.icon]:text-(--color-primary-strong) [&_small]:mt-0.5 [&_small]:block [&_small]:text-xs [&_small]:font-[650] [&_small]:leading-[18px] [&_small]:text-(--color-text-muted) [&_span]:min-w-0 [&_span]:text-[13px] [&_span]:font-extrabold [&_span]:leading-[19px] [&_span]:text-(--color-text) [&_strong]:block [&_strong]:text-sm [&_strong]:leading-[19px] [&_strong]:text-(--color-text)";
const travelPhotoCardClassName =
  "travel-photo-card absolute block overflow-hidden rounded-[10px] border-4 border-[rgb(255_255_255_/_0.92)] bg-white shadow-[0_14px_30px_rgb(15_23_42_/_0.16)] rotate-[var(--card-rotate)] [animation:travel-card-enter_620ms_cubic-bezier(0.2,0.75,0.25,1)_both,travel-card-float_7s_ease-in-out_infinite] [animation-delay:var(--travel-delay,0ms),calc(var(--travel-delay,0ms)+680ms)] after:absolute after:inset-x-0 after:bottom-0 after:h-[54px] after:bg-[linear-gradient(180deg,transparent,rgb(255_255_255_/_0.9))] after:content-[''] motion-reduce:animate-none";
const travelPhotoImageClassName = "travel-photo-image block size-full object-cover";
const travelPhotoHeartClassName =
  "travel-photo-heart absolute right-[11px] top-[11px] z-[2] size-[18px] rounded-full border-2 border-white drop-shadow-[0_1px_2px_rgb(15_23_42_/_0.2)]";
const travelPhotoCaptionClassName =
  "travel-photo-caption absolute inset-x-2.5 bottom-[9px] z-[2] text-[10px] font-[850] text-(--color-text)";
const travelPhotoCardVariants: Record<string, string> = {
  cappadocia: "travel-photo-card--cappadocia right-1.5 top-[240px] h-[154px] w-[208px] [--card-rotate:-4deg] [--float-rotate:-0.7deg] [--float-x:-7px] [--float-y:5px] [--travel-delay:160ms]",
  krabi: "travel-photo-card--krabi right-[-6px] top-2 h-44 w-[146px] [--card-rotate:5deg] [--float-rotate:0.8deg] [--float-x:6px] [--float-y:-8px] [--travel-delay:70ms]",
  kyoto: "travel-photo-card--kyoto right-[100px] top-[366px] h-[148px] w-[172px] [--card-rotate:-2deg] [--float-rotate:-0.5deg] [--float-x:5px] [--float-y:6px] [--travel-delay:240ms]",
  santorini: "travel-photo-card--santorini right-2 top-[348px] h-[146px] w-[184px] [--card-rotate:2deg] [--float-rotate:0.6deg] [--float-x:-6px] [--float-y:-5px] [--travel-delay:320ms]",
};
const travelNextCardClassName =
  "travel-next-card absolute right-0 top-[504px] grid min-h-[72px] w-[196px] grid-cols-[40px_minmax(0,1fr)] items-center gap-2.5 rounded-[10px] border border-[rgb(255_255_255_/_0.92)] bg-[rgb(255_255_255_/_0.94)] p-3 shadow-[0_14px_30px_rgb(15_23_42_/_0.16)] [--float-x:4px] [--float-y:-4px] [animation:travel-card-enter_620ms_cubic-bezier(0.2,0.75,0.25,1)_420ms_both,travel-card-float_7s_ease-in-out_1s_infinite] motion-reduce:animate-none [&_.icon]:size-[34px] [&_.icon]:rounded-full [&_.icon]:bg-(--color-primary-soft) [&_.icon]:p-2 [&_.icon]:text-(--color-primary-strong) [&_small]:block [&_small]:min-w-0 [&_small]:text-[10px] [&_small]:leading-[15px] [&_small]:text-(--color-text-muted) [&_strong]:block [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-xs [&_strong]:leading-4 [&_strong]:text-(--color-text)";

export function AuthTravelCollage({ labels }: { labels: Messages["access"]["entryHero"] }) {
  const photos = [
    { id: "krabi", label: "Krabi, Thailand", alt: "Krabi beach lagoon with limestone cliffs and a longtail boat" },
    { id: "cappadocia", label: "Cappadocia, Turkiye", alt: "Cappadocia sunrise landscape with hot air balloons" },
    { id: "kyoto", label: "Kyoto, Japan", alt: "Kyoto traditional street with wooden houses and a pagoda" },
    { id: "santorini", label: "Santorini, Greece", alt: "Santorini coast with blue domes and the Aegean sea" },
  ];

  return (
    <div className="account-travel-collage" aria-label={labels.collageLabel}>
      {photos.map((photo, index) => (
        <figure className={cn(travelPhotoCardClassName, travelPhotoCardVariants[photo.id])} key={photo.id}>
          <Image alt={photo.alt} className={travelPhotoImageClassName} fill loading={index === 0 ? "eager" : "lazy"} sizes="220px" src={`/landing/auth/photo-${photo.id}.png`} />
          <span className={travelPhotoHeartClassName} aria-hidden="true" />
          <figcaption className={travelPhotoCaptionClassName}>{photo.label}</figcaption>
        </figure>
      ))}
      <span className={travelNextCardClassName}>
        <Icon name="location" />
        <span>
          <small>{labels.nextLabel}</small>
          <strong>{labels.nextTrip}</strong>
          <small>{labels.nextDate}</small>
        </span>
      </span>
    </div>
  );
}

export function AuthHighlights({
  entryHero,
  flow,
  highlights,
}: {
  entryHero?: Messages["access"]["entryHero"];
  flow: AuthFlow;
  highlights: Messages["access"]["highlights"];
}) {
  const items = flow === "register"
    ? [highlights.registerSecure, highlights.registerHistory, highlights.registerOwner]
    : [highlights.secure, highlights.history, highlights.trusted];
  const entryItems = entryHero
    ? [
        { title: entryHero.safeTitle, detail: entryHero.safeDetail },
        { title: entryHero.syncTitle, detail: entryHero.syncDetail },
        { title: entryHero.exploreTitle, detail: entryHero.exploreDetail },
      ]
    : null;

  return (
    <ul className={accountAuthHighlightsClassName} aria-label={highlights.label}>
      <li className={accountAuthHighlightClassName}>
        <Icon name="check" />
        <span>{entryItems ? <><strong>{entryItems[0].title}</strong><small>{entryItems[0].detail}</small></> : items[0]}</span>
      </li>
      <li className={accountAuthHighlightClassName}>
        <Icon name="clock" />
        <span>{entryItems ? <><strong>{entryItems[1].title}</strong><small>{entryItems[1].detail}</small></> : items[1]}</span>
      </li>
      <li className={accountAuthHighlightClassName}>
        <Icon name="key" />
        <span>{entryItems ? <><strong>{entryItems[2].title}</strong><small>{entryItems[2].detail}</small></> : items[2]}</span>
      </li>
    </ul>
  );
}
