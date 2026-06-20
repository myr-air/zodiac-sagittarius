import type { TripCity } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import { customTripCity } from "./account-trip-destinations";

const tripPreviewMapFallbackClassName = "trip-preview-map-fallback absolute inset-0 z-[2]";
const tripCountrySvgFallbackClassName =
  "trip-country-svg-fallback absolute inset-3 z-[2] grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] border border-[rgb(37_99_235_/_0.14)] bg-[linear-gradient(135deg,rgb(255_255_255_/_0.76),rgb(239_246_255_/_0.58))] px-3 [&_svg]:h-[112px] [&_svg]:w-full [&_svg]:min-w-0 [&_path]:fill-[rgb(194_79_22_/_0.18)] [&_path]:stroke-[rgb(194_79_22_/_0.62)] [&_path]:stroke-[1.2px] [&_strong]:grid [&_strong]:size-11 [&_strong]:place-items-center [&_strong]:rounded-[8px] [&_strong]:bg-white [&_strong]:text-sm [&_strong]:font-black [&_strong]:text-(--color-route) [&_strong]:shadow-[0_10px_20px_rgb(15_23_42_/_0.08)]";
const tripPreviewMapSourceClassName =
  "trip-preview-map-source absolute left-2.5 top-2.5 z-[4] inline-flex min-h-7 max-w-[calc(100%_-_20px)] items-center gap-1.5 rounded-full border border-(--color-primary-border) bg-[rgb(255_255_255_/_0.9)] px-[9px] text-[11px] font-black text-(--color-primary-strong) shadow-[0_10px_18px_rgb(15_23_42_/_0.12)] [&_.icon]:size-[13px]";
const tripPreviewRouteLineClassName =
  "trip-preview-route-line absolute left-[28%] top-[52%] w-[44%] -rotate-[13deg] border-t-2 border-dashed border-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]";
const tripPreviewPinClassName =
  "trip-preview-pin absolute z-[1] grid size-[38px] place-items-center rounded-full border border-(--color-primary-border) bg-[rgb(255_255_255_/_0.94)] text-(--color-primary-strong) shadow-[0_12px_24px_rgb(15_23_42_/_0.12)] [&_.icon]:size-[18px]";
const tripPreviewPinOriginClassName = "trip-preview-pin--origin left-[18%] top-[54%]";
const tripPreviewPinDestinationClassName = "trip-preview-pin--destination right-[18%] top-[32%] border-(--color-route-border) text-(--color-route)";

export function TripPreviewMapFallback({ originCity, destinationCity }: { originCity: TripCity; destinationCity?: TripCity }) {
  return (
    <div className={tripPreviewMapFallbackClassName}>
      <FlightRouteFallback originCity={originCity} destinationCity={destinationCity} />
      <span className={cn(tripPreviewPinClassName, tripPreviewPinOriginClassName)}><Icon name="location" /></span>
      <span className={cn(tripPreviewPinClassName, tripPreviewPinDestinationClassName)}><Icon name="map" /></span>
      <span className={tripPreviewRouteLineClassName} />
    </div>
  );
}

export function TripPreviewMapSourceBadge() {
  return (
    <span className={tripPreviewMapSourceClassName}>
      <Icon name="map" />
      OpenFreeMap live map
    </span>
  );
}

function FlightRouteFallback({ originCity, destinationCity }: { originCity: TripCity; destinationCity?: TripCity }) {
  const destination = destinationCity ?? customTripCity("Destination", originCity);
  return (
    <div className={tripCountrySvgFallbackClassName} aria-label={`Flight route from ${originCity.city} to ${destination.city}`}>
      <div>
        <strong>{originCity.countryCode}</strong>
        <span>{originCity.city}</span>
      </div>
      <Icon name="route" />
      <div>
        <strong>{destination.countryCode}</strong>
        <span>{destination.city}</span>
      </div>
    </div>
  );
}
