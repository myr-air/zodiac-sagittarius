"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { NowNextCard } from "./NowNextCard";
import { DaySwitcherStrip } from "./DaySwitcherStrip";
import { CheckOffButton } from "./CheckOffButton";
import { CompanionBottomNav } from "./CompanionBottomNav";
import * as styles from "./OnTripCompanionPage.styles";
import type { OnTripCompanionPageProps } from "./OnTripCompanionPage.types";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function OnTripCompanionPage({
  itineraryItems,
  nowNextState,
  currentDay,
  tripDays,
  onDayChange,
  onCheckOff,
  onUndoCheckOff,
  onNavigate,
  activeNavTab = "now",
  onNavChange,
}: OnTripCompanionPageProps) {
  const { t, locale } = useI18n();
  const otc = t.onTripCompanion;

  // Calculate countdown for current activity
  const countdownMinutes = !nowNextState.current?.endTime
    ? null
    : (() => {
        const now = new Date();
        const [hours, minutes] = nowNextState.current.endTime.split(":").map(Number);
        const endTime = new Date(now);
        endTime.setHours(hours, minutes, 0, 0);
        const diffMs = endTime.getTime() - now.getTime();
        return diffMs > 0 ? Math.floor(diffMs / 60000) : null;
      })();

  // Day labels
  const dayLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const day of tripDays) {
      const d = new Date(day + "T00:00:00");
      labels[day] = `${weekdays[d.getDay()]} ${d.getDate()}`;
    }
    return labels;
  }, [tripDays]);

  // Upcoming activities for current day (excluding current and next from nowNextState)
  const upcomingActivities = useMemo(() => {
    const nowId = nowNextState.current?.id;
    const nextId = nowNextState.next?.id;
    return itineraryItems
      .filter((item) => item.day === currentDay && item.id !== nowId && item.id !== nextId)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [itineraryItems, currentDay, nowNextState]);

  // Check-off state for current activity
  const [checkedOffId, setCheckedOffId] = useState<string | null>(null);

  const handleCheckOff = () => {
    if (!nowNextState.current) return;
    setCheckedOffId(nowNextState.current.id);
    onCheckOff(nowNextState.current.id);
  };

  const handleUndoCheckOff = () => {
    if (!checkedOffId) return;
    onUndoCheckOff(checkedOffId);
    setCheckedOffId(null);
  };

  const isCurrentCheckedOff = checkedOffId === nowNextState.current?.id;

  const noCurrentLabel = locale === "en" ? "No current activity" : "ไม่มีกิจกรรมตอนนี้";

  return (
    <div className={styles.pageClassName}>
      {/* Day Switcher */}
      <div className={styles.daySwitcherWrapperClassName}>
        <DaySwitcherStrip
          days={tripDays}
          selectedDay={currentDay}
          onSelectDay={onDayChange}
          dayLabels={dayLabels}
        />
      </div>

      {/* Main Content */}
      <div className={styles.contentClassName}>
        {/* Now / Next Cards */}
        <NowNextCard
          nowNextState={nowNextState}
          countdownMinutes={countdownMinutes}
          nowLabel={otc.nowLabel}
          nextLabel={otc.nextLabel}
          countdownLabel={(m) => otc.countdownMinutes.replace("{minutes}", String(m))}
          noCurrentLabel={noCurrentLabel}
        />

        {/* Action Buttons for current activity */}
        {nowNextState.current && (
          <div className={styles.actionRowClassName}>
            <Button
              variant="primary"
              onClick={onNavigate}
              className="flex-1 h-11"
              disabled={!nowNextState.current.mapLink}
              data-testid="navigate-button"
            >
              <Icon name="location" /> {otc.navigateButton}
            </Button>
            <CheckOffButton
              activityId={nowNextState.current.id}
              activityName={nowNextState.current.activity}
              isCheckedOff={isCurrentCheckedOff}
              onCheckOff={handleCheckOff}
              onUndoCheckOff={handleUndoCheckOff}
              checkOffButton={otc.checkOffButton}
              checkOffUndo={otc.checkOffUndo}
              checkOffToast={(activity) => otc.checkOffToast.replace("{activity}", activity)}
              className="flex-1"
            />
          </div>
        )}

        {/* Upcoming List */}
        {upcomingActivities.length > 0 && (
          <div data-testid="upcoming-list-section">
            <h3 className="text-sm font-semibold text-(--color-text-muted) mb-2">{otc.upcomingLabel}</h3>
            <div className={styles.upcomingListClassName}>
              {upcomingActivities.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-sm text-(--color-text) py-1.5 border-b border-(--color-border) last:border-0"
                  data-testid={`upcoming-item-${item.id}`}
                >
                  <span className="text-(--color-text-muted) tabular-nums w-12 shrink-0">{item.startTime}</span>
                  <span className="truncate">{item.activity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <CompanionBottomNav
        activeTab={activeNavTab}
        onTabChange={onNavChange}
        labels={{
          now: otc.bottomNavNow,
          map: otc.bottomNavMap,
          checklist: otc.bottomNavChecklist,
          expenses: otc.bottomNavExpenses,
        }}
      />
    </div>
  );
}
