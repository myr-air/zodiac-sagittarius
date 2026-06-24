import type { FormEvent } from "react";
import { cn } from "@/src/lib/cn";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import {
  joinFormClassName,
  joinSubmitClassName,
  passwordInputRowClassName,
  passwordVisibilityButtonClassName,
  tripAccessContentClassName,
  tripAccessFormClassName,
  tripAccessSubmitClassName,
} from "../layout/trip-join-gate.styles";

interface TripJoinRoomFormCopy {
  hideTripPassword: string;
  showTripPassword: string;
  submitRoom: string;
  tripId: string;
  tripPassword: string;
}

interface TripJoinRoomFormProps {
  copy: TripJoinRoomFormCopy;
  isSubmitting: boolean;
  isTripAccessVariant: boolean;
  joinId: string;
  onJoinIdChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleTripPassword: () => void;
  showTripPassword: boolean;
  tripPassword: string;
}

export function TripJoinRoomForm({
  copy,
  isSubmitting,
  isTripAccessVariant,
  joinId,
  onJoinIdChange,
  onPasswordChange,
  onSubmit,
  onToggleTripPassword,
  showTripPassword,
  tripPassword,
}: TripJoinRoomFormProps) {
  return (
    <form className={cn(joinFormClassName, isTripAccessVariant ? tripAccessContentClassName : "", isTripAccessVariant ? tripAccessFormClassName : "")} onSubmit={onSubmit}>
      <label>
        <span>{copy.tripId}</span>
        <input value={joinId} onChange={(event) => onJoinIdChange(event.target.value)} autoComplete="username" required />
      </label>
      <label>
        <span>{copy.tripPassword}</span>
        <span className={passwordInputRowClassName}>
          <input
            value={tripPassword}
            onChange={(event) => onPasswordChange(event.target.value)}
            type={showTripPassword ? "text" : "password"}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className={passwordVisibilityButtonClassName}
            aria-label={showTripPassword ? copy.hideTripPassword : copy.showTripPassword}
            onClick={onToggleTripPassword}
          >
            <Icon name={showTripPassword ? "eyeOff" : "eye"} />
          </button>
        </span>
      </label>
      <Button type="submit" className={cn(joinSubmitClassName, isTripAccessVariant ? tripAccessSubmitClassName : "")} disabled={isSubmitting}>
        <Icon name="check" />
        {copy.submitRoom}
      </Button>
    </form>
  );
}
