import { useEffect, useState } from "react";

export type CopyFeedbackState = "idle" | "copied" | "error";

interface UseCopyFeedbackStateOptions {
  resetDelayMs?: number;
}

export function useCopyFeedbackState({
  resetDelayMs = 2500,
}: UseCopyFeedbackStateOptions = {}) {
  const [copyState, setCopyState] = useState<CopyFeedbackState>("idle");

  useEffect(() => {
    if (copyState === "idle") return undefined;
    const timeout = window.setTimeout(() => setCopyState("idle"), resetDelayMs);
    return () => window.clearTimeout(timeout);
  }, [copyState, resetDelayMs]);

  async function copyText(
    text: string,
    afterCopy?: () => void | Promise<void>,
  ): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      await afterCopy?.();
      setCopyState("copied");
      return true;
    } catch {
      setCopyState("error");
      return false;
    }
  }

  return {
    hasCopied: copyState === "copied",
    copyState,
    copyText,
    markCopyError: () => setCopyState("error"),
    resetCopyState: () => setCopyState("idle"),
  };
}
