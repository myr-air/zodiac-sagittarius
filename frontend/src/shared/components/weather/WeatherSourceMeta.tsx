import { weatherDrawerCopy } from "./model/weather-briefing-drawer-model";
import { metaClassName } from "./weather-briefing-drawer.styles";
import type { WeatherSourceMetaProps } from "./weather-briefing-drawer.types";

export function WeatherSourceMeta({ source, fetchedAt, expiresAt, locale }: WeatherSourceMetaProps) {
  const copy = weatherDrawerCopy(locale);

  return (
    <p className={metaClassName}>
      {source ?? copy.noSource}
      {fetchedAt ? ` · ${copy.fetched} ${fetchedAt}` : ""}
      {expiresAt ? ` · ${copy.expires} ${expiresAt}` : ""}
    </p>
  );
}
