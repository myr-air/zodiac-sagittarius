import type { PlaceResolutionCandidate } from "@/src/trip/types";
import {
  dialogFieldWideClassName,
  dialogWarningClassName,
  placeCandidateButtonClassName,
  placeCandidateListClassName,
} from "./stop-dialog.styles";

export type StopDialogPlaceResolutionState =
  | "idle"
  | "resolving"
  | "ambiguous"
  | "unresolved";

export function StopDialogPlaceResolution({
  candidates,
  candidateListLabel,
  chooseCandidateLabel,
  selectedCandidate,
  state,
  unresolvedMessage,
  onSelectCandidate,
}: {
  candidates: PlaceResolutionCandidate[];
  candidateListLabel: string;
  chooseCandidateLabel: (name: string) => string;
  selectedCandidate?: PlaceResolutionCandidate;
  state: StopDialogPlaceResolutionState;
  unresolvedMessage: string;
  onSelectCandidate: (candidate: PlaceResolutionCandidate) => void;
}) {
  if (state === "ambiguous") {
    return (
      <div className={dialogFieldWideClassName} aria-label={candidateListLabel}>
        <div className={placeCandidateListClassName}>
          {candidates.map((candidate) => (
            <button
              type="button"
              className={placeCandidateButtonClassName}
              key={`${candidate.source}:${candidate.name}:${candidate.address}`}
              aria-label={chooseCandidateLabel(candidate.name)}
              aria-pressed={selectedCandidate?.mapLink === candidate.mapLink}
              onClick={() => onSelectCandidate(candidate)}
            >
              <strong>{candidate.name}</strong>
              <span>{candidate.address}</span>
              <span>{candidate.source} · {Math.round(candidate.confidence * 100)}%</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (state === "unresolved") {
    return (
      <p className={dialogWarningClassName} role="alert">
        {unresolvedMessage}
      </p>
    );
  }

  return null;
}
