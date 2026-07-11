import { enHomeLandingMessages } from "./en.home";
import { enAccessMessages } from "./en.access";
import { enJoinMessages } from "./en.join";
import { enItineraryMessages } from "./en.itinerary";
import { enOverviewMessages } from "./en.overview";
import { enExpensesMessages } from "./en.expenses";

import { enAboutAppMessages, enAppShellMessages, enRoutesMessages, enTripSettingsMessages, enDatesMessages, enPhaseMessages } from "./en.workspace";

import { enMapMessages, enTimelineMessages, enMembersMessages, enContextRailMessages, enStopDialogMessages, enSuggestionsMessages, enDreamerMessages, enFlexibleHunterMessages, enRouteBuilderMessages, enDetailPlannerMessages, enGroupWranglerMessages, enOnTripCompanionMessages } from "./en.workspace-pages";

export const enMessages = {
  common: {
    language: {
      label: "Language",
      currencyLabel: "Language and currency",
      english: "English",
      thai: "Thai",
      switchToEnglish: "English",
      switchToThai: "ภาษาไทย",
    },
    currency: {
      label: "Currency",
    },
    actions: {
      cancel: "Cancel",
      close: "Close",
      save: "Save",
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      confirm: "Confirm",
      back: "Back",
      loading: "Loading",
    },
    status: {
      all: "All",
      open: "Open",
      done: "Done",
      disabled: "Disabled",
      active: "Active",
      pending: "Pending",
      copied: "Copied",
      copyFailed: "Copy failed",
    },
  },
  homeLanding: enHomeLandingMessages,
  aboutApp: enAboutAppMessages,
  appShell: enAppShellMessages,
  routes: enRoutesMessages,
  tripSettings: enTripSettingsMessages,
  dates: enDatesMessages,
  phases: enPhaseMessages,
  overview: enOverviewMessages,
  itinerary: enItineraryMessages,
  map: enMapMessages,
  timeline: enTimelineMessages,
  members: enMembersMessages,
  expenses: enExpensesMessages,
  contextRail: enContextRailMessages,
  stopDialog: enStopDialogMessages,
  suggestions: enSuggestionsMessages,
  dreamer: enDreamerMessages,
  flexibleHunter: enFlexibleHunterMessages,
  routeBuilder: enRouteBuilderMessages,
  detailPlanner: enDetailPlannerMessages,
  groupWrangler: enGroupWranglerMessages,
  onTripCompanion: enOnTripCompanionMessages,
  access: enAccessMessages,
  join: enJoinMessages,
} as const;
