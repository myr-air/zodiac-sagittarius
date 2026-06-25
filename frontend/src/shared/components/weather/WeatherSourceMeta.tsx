import {
  displayDateTimeLocaleCode,
  formatOptionalDisplayDateTime,
} from "@/src/shared/date-time-display";
import { weatherDrawerCopy } from "./model/weather-briefing-drawer-model";
import { metaClassName } from "./weather-briefing-drawer.styles";
import type { WeatherSourceMetaProps } from "./weather-briefing-drawer.types";

function formatWeatherMetaDateTime(value: string | null | undefined, locale: WeatherSourceMetaProps["locale"]): string | null {
  return formatOptionalDisplayDateTime({
    emptyValue: "",
    invalidValue: (rawValue) => rawValue,
    locale: displayDateTimeLocaleCode(locale),
    options: { day: "numeric", hour: "numeric", minute: "2-digit", month: "short" },
    value,
  }) || null;
}

export function WeatherSourceMeta({ source, fetchedAt, locale }: WeatherSourceMetaProps) {
  const copy = weatherDrawerCopy(locale);
  const fetchedAtLabel = formatWeatherMetaDateTime(fetchedAt, locale);

  return (
    <p className={metaClassName}>
      {source ?? copy.noSource}
      {fetchedAtLabel ? ` · ${copy.fetched} ${fetchedAtLabel}` : ""}
    </p>
  );
}
