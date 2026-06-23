import type { Messages } from "@/src/i18n/messages";

export type HomeLandingCopy = Messages["homeLanding"];
export type HomeLandingPreviewCopy = HomeLandingCopy["preview"];
export type HomeWorkflowStepKey = "invite" | "plan" | "travel";
export type HomeWorkflowTone = "coral" | "sand" | "sky";

export const workflowStepMeta = [
  {
    key: "invite",
    icon: "users",
    tone: "coral",
  },
  {
    key: "plan",
    icon: "list",
    tone: "sand",
  },
  {
    key: "travel",
    icon: "wallet",
    tone: "sky",
  },
] satisfies Array<{ key: HomeWorkflowStepKey; icon: "users" | "list" | "wallet"; tone: HomeWorkflowTone }>;

export const previewDayKeys = ["first", "second", "third"] as const;
export const checklistKeys = ["flights", "hotel", "cash", "packing"] as const;
export const checkedChecklistKeys = new Set<(typeof checklistKeys)[number]>(["flights", "hotel", "cash"]);

const previewSectionKeys = ["overview", "itinerary", "map", "budget", "checklist"] as const;

export function buildHomePreviewMenuItems(preview: HomeLandingPreviewCopy) {
  return previewSectionKeys.map((key) => ({
    active: key === "overview",
    key,
    label: preview.sections[key],
  }));
}

export function buildHomePreviewDayCards(preview: HomeLandingPreviewCopy) {
  return previewDayKeys.map((key, artIndex) => ({
    backgroundPosition: `${artIndex * 33.333}% 50%`,
    detail: preview.days[key].detail,
    key,
    label: preview.days[key].day,
    title: preview.days[key].title,
  }));
}

export function buildHomePreviewChecklistItems(preview: HomeLandingPreviewCopy) {
  return checklistKeys.map((key) => ({
    checked: checkedChecklistKeys.has(key),
    key,
    label: preview.checklistItems[key],
  }));
}

export function buildHomeWorkflowItems(landing: HomeLandingCopy) {
  return workflowStepMeta.map((step, index) => ({
    ...step,
    number: index + 1,
    text: landing.workflow.steps[step.key].text,
    title: landing.workflow.steps[step.key].title,
  }));
}
