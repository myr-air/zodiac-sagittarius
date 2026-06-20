export const enStopDialogMessages = {
  titles: {
    create: "Add activity",
    edit: "Edit details",
  },
  closeForm: "Close form",
  fields: {
    time: "Time",
    startTime: "Start time",
    endTime: "End time",
    day: "Day",
    plan: "Plan",
    hours: "Hours",
    minutes: "Minutes",
    activity: "Activity",
    type: "Type",
    place: "Place",
    mapLink: "Map link",
    transportation: "Transportation",
    note: "Note",
  },
  actions: {
    cancel: "Cancel",
    create: "Save activity",
    edit: "Save changes",
    delete: "Delete stop",
    chooseCandidate: ({ name }: { name: string }) => `Choose ${name}`,
    saveUnresolved: "Save without coordinates",
  },
  placeResolution: {
    candidates: "Place candidates",
    unresolved: "Coordinates could not be resolved. Saving without coordinates keeps the place/map link, but the map pin and route checks will need review later.",
  },
  messages: {
    saving: "Saving...",
    saveFailed: "Could not save activity. Check required fields or try again.",
  },
} as const;
