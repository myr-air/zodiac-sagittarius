import { emptyText } from "./model/weather-briefing-drawer-model";
import { briefingBlockClassName } from "./weather-briefing-drawer.styles";
import type { WeatherTextBlockProps } from "./weather-briefing-drawer.types";
import { WeatherSourceMeta } from "./WeatherSourceMeta";

export function WeatherTextBlock({ title, block, locale }: WeatherTextBlockProps) {
  return (
    <section className={briefingBlockClassName}>
      <h3 className="m-0 text-sm font-black">{title}</h3>
      <p className="m-0 text-sm font-bold text-(--color-text-muted)">{block?.body ?? emptyText(locale)}</p>
      <WeatherSourceMeta source={block?.meta.source} fetchedAt={block?.meta.fetchedAt} expiresAt={block?.meta.expiresAt} locale={locale} />
    </section>
  );
}
