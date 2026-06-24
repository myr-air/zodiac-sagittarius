import {
  joinVisibleTextParts,
  visibleTextParts,
} from "@/src/shared/text-parts";
import {
  formatWeatherDecimal,
  formatWeatherTemp,
} from "@/src/trip/weather";

export function joinWeatherMetricParts(parts: Array<string | null>): string | null {
  return joinVisibleTextParts(parts, " · ");
}

export function formatWeatherTemperaturePair(
  high: number | null | undefined,
  low: number | null | undefined,
): string | null {
  const parts = visibleTextParts([
    typeof high === "number" ? formatWeatherTemp(high) : null,
    typeof low === "number" ? formatWeatherTemp(low) : null,
  ]);
  return parts.length > 0 ? parts.join(" ") : null;
}

export function formatLabeledWeatherTemperaturePair(
  label: string,
  high: number | null | undefined,
  low: number | null | undefined,
): string | null {
  const pair = formatWeatherTemperaturePair(high, low);
  return pair ? `${label} ${pair}` : null;
}

export function formatWeatherMetric(
  label: string | null,
  value: number | null | undefined,
  unit = "",
  options: {
    transform?: (value: number) => number | string;
    unitSeparator?: string;
  } = {},
): string | null {
  if (typeof value !== "number") return null;
  const transform = options.transform ?? formatWeatherDecimal;
  const unitSeparator = options.unitSeparator ?? " ";
  const formattedValue = `${transform(value)}${unit ? `${unitSeparator}${unit}` : ""}`;
  return label ? `${label} ${formattedValue}` : formattedValue;
}

export function formatWeatherPercentMetric(
  label: string,
  value: number | null | undefined,
): string | null {
  return typeof value === "number" ? `${label} ${value}%` : null;
}

export function metersToWeatherKilometers(
  value: number | null | undefined,
): number | null {
  return typeof value === "number" ? value / 1000 : null;
}
