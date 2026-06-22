import {
  DARK_TEXT,
  MINIMUM_A11Y_CONTRAST,
} from "./route-map.config";
import type { DayColorStyle, MarkerStyle, RoutePoint } from "./route-map.types";

function hexToLinear(component: string): number {
  const value = Number.parseInt(component, 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number {
  if (color.length !== 7 || !/^#[0-9a-fA-F]{6}$/.test(color)) return 0;
  const red = hexToLinear(color.slice(1, 3));
  const green = hexToLinear(color.slice(3, 5));
  const blue = hexToLinear(color.slice(5, 7));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const brightest = Math.max(foregroundLuminance, backgroundLuminance);
  const darkest = Math.min(foregroundLuminance, backgroundLuminance);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function markerTextColor(color: string): string {
  if (contrastRatio("#ffffff", color) >= MINIMUM_A11Y_CONTRAST) return "#ffffff";
  return DARK_TEXT;
}

export function routeLineStyle(color: string): DayColorStyle {
  return { "--day-color": color };
}

export function dayFilterStyle(color: string): DayColorStyle {
  return { "--day-color": color };
}

export function markerStyle(point: RoutePoint, index: number, color: string): MarkerStyle {
  return {
    "--day-color": color,
    "--route-marker-text-color": markerTextColor(color),
    "--x": `${point.x}%`,
    "--y": `${point.y}%`,
    "--marker-delay": `${index * 18}ms`,
  };
}
