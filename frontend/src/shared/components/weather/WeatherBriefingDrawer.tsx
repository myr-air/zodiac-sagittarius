import { type FormEvent, useState } from "react";
import type { Locale } from "@/src/i18n/types";
import type { DailyBriefingOverrides, TextBriefingBlock, TripDailyBriefing } from "@/src/trip/types";
import { formatSolarTime } from "@/src/trip/weather";
import { Button } from "@/src/ui";
import {
  buildWeatherDetailLines,
  emptyText,
  formatFullDate,
  formatPercent,
  formatSpeed,
  formatWeatherSummary,
  weatherDrawerCopy,
} from "./model/weather-briefing-drawer-model";

interface WeatherBriefingDrawerProps {
  briefing: TripDailyBriefing | null;
  locale: Locale;
  canEdit: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSaveOverrides?: (date: string, version: number, overrides: DailyBriefingOverrides) => void;
}

const drawerClassName =
  "weather-briefing-drawer fixed bottom-0 right-0 top-0 z-[50] grid w-[min(720px,78vw)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-l border-(--color-border) bg-(--color-surface) shadow-[-28px_0_70px_rgb(15_23_42_/_0.18)] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none max-[767px]:top-auto max-[767px]:h-[88vh] max-[767px]:w-full max-[767px]:rounded-t-[24px] max-[767px]:border-l-0 max-[767px]:border-t max-[767px]:shadow-[0_-24px_70px_rgb(15_23_42_/_0.22)]";
const drawerHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-(--color-border) px-5 py-4";
const drawerBodyClassName = "grid min-h-0 grid-cols-2 gap-3 overflow-auto p-5 max-[767px]:grid-cols-1";
const briefingBlockClassName = "grid content-start gap-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-4";
const metaClassName = "text-[11px] font-extrabold leading-4 text-(--color-text-muted)";
const textAreaClassName = "min-h-16 rounded-(--radius-sm) border border-(--color-border) bg-white p-2 text-sm font-bold text-(--color-text)";

export function WeatherBriefingDrawer({ briefing, locale, canEdit, isOpen, onClose, onSaveOverrides }: WeatherBriefingDrawerProps) {
  if (!isOpen || !briefing) return null;
  const copy = weatherDrawerCopy(locale);
  const weather = briefing.weather;
  const outfitBody = briefing.manualOverrides.outfitAdvice ?? briefing.outfitAdvice?.body ?? emptyText(locale);
  const summary = formatWeatherSummary(weather?.conditionLabel, weather?.temperatureMaxCelsius, weather?.temperatureMinCelsius, locale);
  const sunrise = formatSolarTime(weather?.sunrise);
  const sunset = formatSolarTime(weather?.sunset);
  const extraWeatherDetails = weather ? buildWeatherDetailLines(weather, locale) : [];

  return (
      <section className={drawerClassName} role="region" aria-label={copy.regionLabel}>
        <header className={drawerHeaderClassName}>
          <div>
            <p className="m-0 text-xs font-black leading-4 text-(--color-text-muted)">{formatFullDate(briefing.date, locale)} · {briefing.locationLabel}</p>
            <h2 className="m-0 mt-1 text-2xl font-black leading-8 text-(--color-text)">{summary}</h2>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>{copy.close}</Button>
        </header>

        <div className={drawerBodyClassName}>
          <section className={briefingBlockClassName}>
            <h3 className="m-0 text-sm font-black">{copy.weather}</h3>
            <p className="m-0 text-sm font-bold text-(--color-text-muted)">
              {copy.humidity} {formatPercent(weather?.humidityPercent)} · {copy.wind} {formatSpeed(weather?.windSpeedKph)} · {copy.rain} {formatPercent(weather?.rainChancePercent)}
            </p>
            {sunrise && sunset ? (
              <p className="m-0 text-sm font-bold text-(--color-text-muted)">
                {copy.sunrise} {sunrise} · {copy.sunset} {sunset}
              </p>
            ) : null}
            {extraWeatherDetails.map((line) => (
              <p className="m-0 text-sm font-bold text-(--color-text-muted)" key={line}>
                {line}
              </p>
            ))}
            <SourceMeta source={weather?.meta.source} fetchedAt={weather?.meta.fetchedAt} expiresAt={weather?.meta.expiresAt} locale={locale} />
          </section>

          <section className={briefingBlockClassName}>
            <h3 className="m-0 text-sm font-black">{copy.outfitAdvice}</h3>
            <p className="m-0 text-sm font-bold text-(--color-text-muted)">{outfitBody}</p>
          </section>

          <TextBlock title={copy.holiday} block={briefing.holiday} locale={locale} />
          <TextBlock title={copy.festival} block={briefing.festival} locale={locale} />
          <TextBlock title={copy.dailyFacts} block={briefing.facts} locale={locale} />

          {canEdit ? (
            <OrganizerOverrideForm
              briefing={briefing}
              key={`${briefing.date}-${briefing.version}`}
              locale={locale}
              onSaveOverrides={onSaveOverrides}
            />
          ) : null}
        </div>
      </section>
  );
}

function OrganizerOverrideForm({
  briefing,
  locale,
  onSaveOverrides,
}: {
  briefing: TripDailyBriefing;
  locale: Locale;
  onSaveOverrides?: (date: string, version: number, overrides: DailyBriefingOverrides) => void;
}) {
  const copy = weatherDrawerCopy(locale);
  const [outfitAdvice, setOutfitAdvice] = useState(briefing.manualOverrides.outfitAdvice ?? "");
  const [festivalNote, setFestivalNote] = useState(briefing.manualOverrides.festivalNote ?? "");
  const [factsNote, setFactsNote] = useState(briefing.manualOverrides.factsNote ?? "");

  function submitOverrides(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSaveOverrides?.(briefing.date, briefing.version, {
      outfitAdvice: outfitAdvice.trim() || null,
      festivalNote: festivalNote.trim() || null,
      factsNote: factsNote.trim() || null,
    });
  }

  return (
    <form className={briefingBlockClassName} onSubmit={submitOverrides}>
      <h3 className="m-0 text-sm font-black">{copy.organizerNotes}</h3>
      <label className="grid gap-1 text-xs font-extrabold text-(--color-text-muted)">
        {copy.outfitOverride}
        <textarea className={textAreaClassName} value={outfitAdvice} onChange={(event) => setOutfitAdvice(event.target.value)} />
      </label>
      <label className="grid gap-1 text-xs font-extrabold text-(--color-text-muted)">
        {copy.festivalOverride}
        <textarea className={textAreaClassName} value={festivalNote} onChange={(event) => setFestivalNote(event.target.value)} />
      </label>
      <label className="grid gap-1 text-xs font-extrabold text-(--color-text-muted)">
        {copy.factsOverride}
        <textarea className={textAreaClassName} value={factsNote} onChange={(event) => setFactsNote(event.target.value)} />
      </label>
      <Button type="submit">{copy.save}</Button>
    </form>
  );
}

function TextBlock({ title, block, locale }: { title: string; block: TextBriefingBlock | null; locale: Locale }) {
  return (
    <section className={briefingBlockClassName}>
      <h3 className="m-0 text-sm font-black">{title}</h3>
      <p className="m-0 text-sm font-bold text-(--color-text-muted)">{block?.body ?? emptyText(locale)}</p>
      <SourceMeta source={block?.meta.source} fetchedAt={block?.meta.fetchedAt} expiresAt={block?.meta.expiresAt} locale={locale} />
    </section>
  );
}

function SourceMeta({ source, fetchedAt, expiresAt, locale }: { source?: string; fetchedAt?: string | null; expiresAt?: string | null; locale: Locale }) {
  const copy = weatherDrawerCopy(locale);
  return <p className={metaClassName}>{source ?? copy.noSource}{fetchedAt ? ` · ${copy.fetched} ${fetchedAt}` : ""}{expiresAt ? ` · ${copy.expires} ${expiresAt}` : ""}</p>;
}
