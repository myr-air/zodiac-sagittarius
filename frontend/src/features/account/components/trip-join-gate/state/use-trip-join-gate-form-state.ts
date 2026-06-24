import { useState } from "react";

export function useTripJoinGateFormState(initialJoinCode?: string) {
  const [joinId, setJoinId] = useState(initialJoinCode ?? "");
  const [tripPassword, setTripPassword] = useState("");
  const [participantPassword, setParticipantPassword] = useState("");
  const [showTripPassword, setShowTripPassword] = useState(false);
  const [showParticipantPassword, setShowParticipantPassword] = useState(false);

  function resetParticipantPassword() {
    setParticipantPassword("");
    setShowParticipantPassword(false);
  }

  return {
    joinId,
    participantPassword,
    resetParticipantPassword,
    setJoinId,
    setParticipantPassword,
    setShowParticipantPassword,
    setShowTripPassword,
    setTripPassword,
    showParticipantPassword,
    showTripPassword,
    tripPassword,
  };
}
