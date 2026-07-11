import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Button, Icon, TextInput } from "@/src/ui";
import { cn } from "@/src/lib/cn";
import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";
import type { WaypointMapSurfaceProps } from "./RouteBuilderPage.types";
import {
  addStopFormClassName,
  addStopFormGridClassName,
  controlsClassName,
  distanceBadgeClassName,
  distanceBadgesRowClassName,
  emptyPromptClassName,
  formActionsClassName,
  formErrorClassName,
  mapContainerClassName,
  mapStatusOverlayClassName,
  mapSurfaceClassName,
} from "./RouteBuilderPage.styles";
import { useWaypointMap } from "./useWaypointMap";
import {
  computeDistanceBadges,
  renumberWaypoints,
  sortWaypoints,
} from "./route-builder.utils";

function makeWaypointId(counter: number): string {
  return `wp-${Date.now()}-${counter}`;
}

export function WaypointMapSurface({
  waypoints,
  tripDestination,
  onWaypointsChange,
  liveMapEnabled,
  className,
}: WaypointMapSurfaceProps) {
  const { t } = useI18n();
  const sorted = useMemo(() => sortWaypoints(waypoints), [waypoints]);
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState({ name: "", lat: "", lng: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const idCounterRef = useRef(0);

  const handleMapClick = useCallback(
    (lngLat: [number, number]) => {
      const [lng, lat] = lngLat;
      const tripId = sorted[0]?.tripId ?? "";
      idCounterRef.current += 1;
      const added: Waypoint = {
        id: makeWaypointId(idCounterRef.current),
        tripId,
        name: `${t.routeBuilder.waypointCount} ${sorted.length + 1}`,
        lat,
        lng,
        sortOrder: sorted.length + 1,
      };
      onWaypointsChange(renumberWaypoints([...sorted, added]));
    },
    [sorted, onWaypointsChange, t],
  );

  const handleWaypointMove = useCallback(
    (id: string, lat: number, lng: number) => {
      onWaypointsChange(
        sorted.map((waypoint) =>
          waypoint.id === id ? { ...waypoint, lat, lng } : waypoint,
        ),
      );
    },
    [sorted, onWaypointsChange],
  );

  const { mapState, mapContainerRef } = useWaypointMap({
    waypoints,
    tripDestination,
    liveMapEnabled,
    onMapClick: handleMapClick,
    onWaypointMove: handleWaypointMove,
  });

  const handleFormChange = useCallback(
    (field: keyof typeof formValues) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormValues((current) => ({ ...current, [field]: event.target.value }));
      setFormErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const name = formValues.name.trim();
      const lat = Number(formValues.lat);
      const lng = Number(formValues.lng);
      const errors: Record<string, string> = {};

      if (!name) errors.name = "Required";
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        errors.lat = "Invalid latitude";
      }
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        errors.lng = "Invalid longitude";
      }

      setFormErrors(errors);
      if (Object.keys(errors).length > 0) return;

      const tripId = sorted[0]?.tripId ?? "";
      idCounterRef.current += 1;
      const added: Waypoint = {
        id: makeWaypointId(idCounterRef.current),
        tripId,
        name,
        lat,
        lng,
        sortOrder: sorted.length + 1,
      };

      onWaypointsChange(renumberWaypoints([...sorted, added]));
      setFormValues({ name: "", lat: "", lng: "" });
      setFormOpen(false);
    },
    [formValues, sorted, onWaypointsChange],
  );

  const badges = useMemo(() => computeDistanceBadges(sorted), [sorted]);

  return (
    <div className={cn(mapSurfaceClassName, className)}>
      <div className="relative min-h-0 flex-1">
        {sorted.length === 0 && (
          <div className={emptyPromptClassName}>
            <Icon name="map" />
            <span>
              {tripDestination?.label
                ? `${t.routeBuilder.placeWaypointPrompt} — ${tripDestination.label}`
                : t.routeBuilder.placeWaypointPrompt}
            </span>
          </div>
        )}

        <div
          ref={mapContainerRef}
          className={mapContainerClassName}
          aria-label={t.routeBuilder.canvasLabel}
        />

        {mapState === "loading" && (
          <div className={mapStatusOverlayClassName}>
            <Icon name="clock" />
            <span>Loading</span>
          </div>
        )}

        {mapState === "error" && (
          <div className={mapStatusOverlayClassName} role="status">
            <Icon name="warning" />
            <span>{t.routeBuilder.noSuggestionsFallback}</span>
          </div>
        )}
      </div>

      {badges.length > 0 && (
        <div className={distanceBadgesRowClassName}>
          {badges.map((badge) => (
            <span
              key={badge.id}
              className={distanceBadgeClassName}
              data-testid="distance-badge"
            >
              {badge.text}
            </span>
          ))}
        </div>
      )}

      <div className={controlsClassName}>
        {!formOpen ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setFormOpen(true)}
            data-testid="add-stop-button"
          >
            <Icon name="plus" />
            {t.routeBuilder.addStopButton}
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className={addStopFormClassName}>
            <TextInput
              placeholder="Name"
              value={formValues.name}
              onChange={handleFormChange("name")}
              aria-label="Stop name"
              data-testid="add-stop-name"
            />
            {formErrors.name && (
              <span className={formErrorClassName}>{formErrors.name}</span>
            )}
            <div className={addStopFormGridClassName}>
              <TextInput
                placeholder="Latitude"
                value={formValues.lat}
                onChange={handleFormChange("lat")}
                aria-label="Latitude"
                data-testid="add-stop-lat"
              />
              <TextInput
                placeholder="Longitude"
                value={formValues.lng}
                onChange={handleFormChange("lng")}
                aria-label="Longitude"
                data-testid="add-stop-lng"
              />
            </div>
            {(formErrors.lat || formErrors.lng) && (
              <span className={formErrorClassName}>
                {formErrors.lat || formErrors.lng}
              </span>
            )}
            <div className={formActionsClassName}>
              <Button type="submit" data-testid="add-stop-submit">
                {t.common.actions.add}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFormOpen(false)}
              >
                {t.common.actions.cancel}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
