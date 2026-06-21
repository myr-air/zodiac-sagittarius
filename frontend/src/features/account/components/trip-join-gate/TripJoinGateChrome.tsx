"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/src/ui/icons";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { cn } from "@/src/lib/cn";
import {
  embeddedJoinPageClassName,
  embeddedJoinShellClassName,
  joinAlertClassName,
  joinAlertStackClassName,
  joinEyebrowClassName,
  joinHeroClassName,
  joinMarkClassName,
  joinPageClassName,
  joinShellClassName,
  tripAccessContentClassName,
  tripAccessHeroClassName,
  tripAccessJoinMarkClassName,
  tripAccessJoinShellClassName,
  tripAccessRightColumnClassName,
} from "./layout/trip-join-gate.styles";
import { TripJoinGateVisual } from "./TripJoinGateVisual";

interface TripJoinGateChromeProps {
  children: ReactNode;
  embedded: boolean;
  error: string | null;
  eyebrow: string;
  isTripAccessVariant: boolean;
  pageLabel: string;
  showLanguageSwitch: boolean;
  step: "room" | "participant";
  text: {
    participantDetail: string;
    participantTitle: string;
    roomDetail: string;
    roomTitle: string;
  };
  visual: {
    label: string;
    notes: Array<{
      detail: string;
      icon: IconName;
      title: string;
    }>;
  };
}

export function TripJoinGateChrome({
  children,
  embedded,
  error,
  eyebrow,
  isTripAccessVariant,
  pageLabel,
  showLanguageSwitch,
  step,
  text,
  visual,
}: TripJoinGateChromeProps) {
  const PageElement = embedded ? "section" : "main";

  return (
    <PageElement className={cn(joinPageClassName, embedded ? embeddedJoinPageClassName : "")} aria-label={pageLabel}>
      <section className={cn(joinShellClassName, embedded ? embeddedJoinShellClassName : "", isTripAccessVariant ? tripAccessJoinShellClassName : "")}>
        <TripJoinGateVisual label={visual.label} notes={visual.notes} />
        <div className={isTripAccessVariant ? tripAccessRightColumnClassName : "contents"}>
          <div className={cn(joinHeroClassName, isTripAccessVariant ? tripAccessContentClassName : "", isTripAccessVariant ? tripAccessHeroClassName : "")}>
            <div className={cn(joinMarkClassName, isTripAccessVariant ? tripAccessJoinMarkClassName : "")} aria-hidden="true">
              <Icon name="route" />
            </div>
            <div>
              <p className={joinEyebrowClassName}>{eyebrow}</p>
              <h1>{step === "room" ? text.roomTitle : text.participantTitle}</h1>
              <p>{step === "room" ? text.roomDetail : text.participantDetail}</p>
              {showLanguageSwitch ? <LanguageSwitch className="access-language-switch mt-3.5" /> : null}
            </div>
          </div>

          {error ? (
            <div className={joinAlertStackClassName} aria-live="polite">
              <p className={joinAlertClassName} role="alert">
                <Icon name="alertCircle" />
                {error}
              </p>
            </div>
          ) : null}

          {children}
        </div>
      </section>
    </PageElement>
  );
}
