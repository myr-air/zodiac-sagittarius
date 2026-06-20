"use client";

import { useState } from "react";

export function useEmailLoginFormState() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [homeBase, setHomeBase] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);

  function clearCodeAndPassword() {
    setCode("");
    setPassword("");
  }

  function resetEntryFields() {
    clearCodeAndPassword();
    setDisplayName("");
    setHomeBase("");
  }

  function updateCode(value: string) {
    setCode(value.replace(/\D/g, "").slice(0, 6));
  }

  return {
    code,
    displayName,
    email,
    homeBase,
    password,
    trustDevice,
    clearCodeAndPassword,
    resetEntryFields,
    setDisplayName,
    setEmail,
    setHomeBase,
    setPassword,
    setTrustDevice,
    updateCode,
  };
}
