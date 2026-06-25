import { formatSolarTime, weatherIconForCondition } from "@/src/trip/weather";
import type { TextBriefingBlock } from "@/src/trip/types";
import { Button } from "@/src/ui";
import { Icon, type IconName } from "@/src/ui/icons";
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
  briefingImpactClassName,
  briefingImpactIconClassName,
  briefingImpactTextClassName,
  briefingSurfaceClassName,
  drawerBodyClassName,
  drawerClassName,
  drawerCloseButtonClassName,
  drawerHeroMetaClassName,
  drawerHeroTitleClassName,
  drawerHeaderClassName,
  organizerDisclosureClassName,
  pendingBriefingClassName,
  primaryWeatherBlockClassName,
  secondaryBriefingListClassName,
  secondaryBriefingRowClassName,
  weatherDetailPillClassName,
  weatherMetricChipClassName,
  weatherMetricGridClassName,
} from "./weather-briefing-drawer.styles";
import type { WeatherBriefingDrawerProps } from "./weather-briefing-drawer.types";
import { WeatherOrganizerOverrideForm } from "./WeatherOrganizerOverrideForm";
import { WeatherSourceMeta } from "./WeatherSourceMeta";
import { WeatherTextBlock } from "./WeatherTextBlock";

export function WeatherBriefingDrawer({ briefing, locale, canEdit, isOpen, onClose, onSaveOverrides, variant = "overlay" }: WeatherBriefingDrawerProps) {
  if (!isOpen || !briefing) return null;
  const copy = weatherDrawerCopy(locale);
  const weather = briefing.weather;
  const outfitBody = briefing.manualOverrides.outfitAdvice ?? briefing.outfitAdvice?.body ?? emptyText(locale);
  const summary = formatWeatherSummary(weather?.conditionLabel, weather?.temperatureMaxCelsius, weather?.temperatureMinCelsius, locale);
  const sunrise = formatSolarTime(weather?.sunrise);
  const sunset = formatSolarTime(weather?.sunset);
  const extraWeatherDetails = weather ? buildWeatherDetailLines(weather, locale) : [];
  const hasForecastSignal = Boolean(
    weather && (
      typeof weather.temperatureMaxCelsius === "number" ||
      typeof weather.temperatureMinCelsius === "number" ||
      typeof weather.humidityPercent === "number" ||
      typeof weather.windSpeedKph === "number" ||
      typeof weather.rainChancePercent === "number" ||
      sunrise ||
      sunset ||
      extraWeatherDetails.length
    ),
  );
  const metricCards = [
    { label: copy.humidity, value: formatPercent(weather?.humidityPercent) },
    { label: copy.rain, value: formatPercent(weather?.rainChancePercent) },
    { label: copy.wind, value: formatSpeed(weather?.windSpeedKph) },
    { label: `${copy.sunrise} / ${copy.sunset}`, value: sunrise && sunset ? `${sunrise} / ${sunset}` : "--" },
  ];
  const tripImpact =
    typeof weather?.rainChancePercent === "number" && weather.rainChancePercent >= 50
      ? copy.impactRain
      : typeof weather?.uvIndexMax === "number" && weather.uvIndexMax >= 7
        ? copy.impactUv
        : typeof weather?.windGustsKph === "number" && weather.windGustsKph >= 40
          ? copy.impactWind
          : copy.impactDefault;
  const impactIcon: IconName =
    typeof weather?.rainChancePercent === "number" && weather.rainChancePercent >= 50
      ? "umbrella"
      : typeof weather?.uvIndexMax === "number" && weather.uvIndexMax >= 7
        ? "sun"
        : typeof weather?.windGustsKph === "number" && weather.windGustsKph >= 40
          ? "warning"
          : weatherIconForCondition(weather?.conditionCode);
  const outfitBlock: TextBriefingBlock | null =
    outfitBody !== emptyText(locale)
      ? briefing.outfitAdvice ?? {
        title: copy.outfitAdvice,
        body: outfitBody,
        meta: { source: "Sagittarius", sourceUrl: null, fetchedAt: null, expiresAt: null, confidence: "medium", unavailableReason: null },
      }
      : null;
  const secondaryRows = [
    outfitBlock ? { title: copy.outfitAdvice, block: outfitBlock } : null,
    briefing.holiday?.body ? { title: copy.holiday, block: briefing.holiday } : null,
    briefing.festival?.body && hasForecastSignal ? { title: copy.festival, block: briefing.festival } : null,
    briefing.facts?.body ? { title: copy.dailyFacts, block: briefing.facts } : null,
  ].filter((row): row is { title: string; block: TextBriefingBlock } => Boolean(row));
  const showChromeHeader = variant === "overlay";

  return (
    <section className={variant === "inline" ? briefingSurfaceClassName : drawerClassName} role="region" aria-label={copy.regionLabel}>
      {showChromeHeader ? (
        <header className={drawerHeaderClassName}>
          <div>
            <p className={drawerHeroMetaClassName}>{formatFullDate(briefing.date, locale)} · {briefing.locationLabel}</p>
            <h2 className={drawerHeroTitleClassName}>{summary}</h2>
          </div>
          <Button type="button" variant="ghost" className={drawerCloseButtonClassName} aria-label={copy.close} onClick={onClose}>
            <Icon name="x" />
          </Button>
        </header>
      ) : null}

      <div className={drawerBodyClassName}>
        {hasForecastSignal ? (
          <>
            <section className={briefingImpactClassName}>
              <span className={briefingImpactIconClassName}>
                <Icon name={impactIcon} />
              </span>
              <div className={briefingImpactTextClassName}>
                <h3>{copy.tripImpact}</h3>
                <p>{tripImpact}</p>
              </div>
            </section>
            <section className={primaryWeatherBlockClassName}>
              <h3 className="m-0 text-sm font-black">{copy.weather}</h3>
              <div className={weatherMetricGridClassName}>
                {metricCards.map((metric) => (
                  <span className={weatherMetricChipClassName} key={metric.label}>
                    <small>{metric.label}</small>
                    <strong>{metric.value}</strong>
                  </span>
                ))}
              </div>
              {extraWeatherDetails.map((line) => (
                <span className={weatherDetailPillClassName} key={line}>
                  {line}
                </span>
              ))}
              <WeatherSourceMeta source={weather?.meta.source} fetchedAt={weather?.meta.fetchedAt} expiresAt={weather?.meta.expiresAt} locale={locale} />
            </section>
          </>
        ) : (
          <section className={pendingBriefingClassName}>
            <span className={briefingImpactIconClassName}>
              <Icon name="cloud" />
            </span>
              <div className={briefingImpactTextClassName}>
                <h3>{copy.pendingTitle}</h3>
                <p>{copy.pendingBody}</p>
              </div>
            <WeatherSourceMeta source={weather?.meta.source} fetchedAt={weather?.meta.fetchedAt} expiresAt={weather?.meta.expiresAt} locale={locale} />
          </section>
        )}

        {secondaryRows.length ? (
          <section className={secondaryBriefingListClassName} aria-label={copy.supportingDetails}>
            {secondaryRows.map((row) => (
              <WeatherTextBlock className={secondaryBriefingRowClassName} showMeta={false} title={row.title} block={row.block} locale={locale} key={row.title} />
            ))}
          </section>
        ) : null}

        {canEdit && hasForecastSignal ? (
          <details className={organizerDisclosureClassName}>
            <summary>{copy.organizerNotes}</summary>
            <WeatherOrganizerOverrideForm
              briefing={briefing}
              compact={false}
              key={`${briefing.date}-${briefing.version}`}
              locale={locale}
              onSaveOverrides={onSaveOverrides}
            />
          </details>
        ) : null}
      </div>
    </section>
  );
}
