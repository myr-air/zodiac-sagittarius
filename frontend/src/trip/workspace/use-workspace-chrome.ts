import { useCallback, useEffect, useState } from "react";

type ContextRailPreferredTab = "notes" | "booking" | "suggestions";

export function useWorkspaceChrome() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextRailOpen, setContextRailOpen] = useState(false);
  const [contextRailMounted, setContextRailMounted] = useState(false);
  const [contextRailPreferredTab, setContextRailPreferredTab] =
    useState<ContextRailPreferredTab>("notes");

  useEffect(() => {
    if (contextRailOpen) return undefined;
    const timeout = window.setTimeout(() => setContextRailMounted(false), 900);
    return () => window.clearTimeout(timeout);
  }, [contextRailOpen]);

  const setContextRailVisibility = useCallback((open: boolean) => {
    if (open) setContextRailMounted(true);
    setContextRailOpen(open);
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((current) => !current);
  }, []);

  const toggleContextRail = useCallback(() => {
    setContextRailVisibility(!contextRailOpen);
  }, [contextRailOpen, setContextRailVisibility]);

  useEffect(() => {
    if (!contextRailOpen) return undefined;

    function closeContextRailFromOutside(event: Event) {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".context-rail")) return;
      if (event.target.closest(".page-header, .side-rail")) return;
      if (event.target.closest('[role="dialog"]')) return;
      if (event.target.closest(".data-row")) return;
      setContextRailVisibility(false);
    }

    document.addEventListener("pointerdown", closeContextRailFromOutside);
    document.addEventListener("click", closeContextRailFromOutside);
    return () => {
      document.removeEventListener("pointerdown", closeContextRailFromOutside);
      document.removeEventListener("click", closeContextRailFromOutside);
    };
  }, [contextRailOpen, setContextRailVisibility]);

  return {
    contextRailMounted,
    contextRailOpen,
    contextRailPreferredTab,
    setContextRailPreferredTab,
    setContextRailVisibility,
    sidebarCollapsed,
    toggleContextRail,
    toggleSidebarCollapsed,
  };
}
