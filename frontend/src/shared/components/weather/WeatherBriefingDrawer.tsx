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
import {
  briefingBlockClassName,
  drawerBodyClassName,
  drawerClassName,
  drawerHeaderClassName,
} from "./weather-briefing-drawer.styles";
import type { WeatherBriefingDrawerProps } from "./weather-briefing-drawer.types";
import { WeatherOrganizerOverrideForm } from "./WeatherOrganizerOverrideForm";
import { WeatherSourceMeta } from "./WeatherSourceMeta";
import { WeatherTextBlock } from "./WeatherTextBlock";

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
            <WeatherSourceMeta source={weather?.meta.source} fetchedAt={weather?.meta.fetchedAt} expiresAt={weather?.meta.expiresAt} locale={locale} />
          </section>

          <section className={briefingBlockClassName}>
            <h3 className="m-0 text-sm font-black">{copy.outfitAdvice}</h3>
            <p className="m-0 text-sm font-bold text-(--color-text-muted)">{outfitBody}</p>
          </section>

          <WeatherTextBlock title={copy.holiday} block={briefing.holiday} locale={locale} />
          <WeatherTextBlock title={copy.festival} block={briefing.festival} locale={locale} />
          <WeatherTextBlock title={copy.dailyFacts} block={briefing.facts} locale={locale} />

          {canEdit ? (
            <WeatherOrganizerOverrideForm
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
