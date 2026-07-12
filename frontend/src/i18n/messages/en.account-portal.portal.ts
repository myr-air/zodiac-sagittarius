export const enAccountPortalPortalMessages = {
  title: "Portal",
  nav: {
    label: "Portal navigation",
    dashboard: "Dashboard",
    trips: "My Trips",
    explorer: "Explorer",
    todos: "Trip To-dos",
    vault: "Travel Vault",
    settings: "Settings",
  },
  sections: {
    dashboard: {
      title: "Dashboard",
      detail: "User data stats and session status.",
    },
    trips: {
      title: "My Trips",
    },
    explorer: {
      title: "Explorer",
      detail: "Find shared trips from people in your system.",
    },
    todos: {
      title: "Trip To-dos",
      detail: "A calmer name for checklists and tasks.",
      empty: "No to-dos yet.",
    },
    vault: {
      title: "Travel Vault",
      detail: "A calmer name for notes and files.",
      empty: "No notes or files yet.",
    },
    signOut: {
      title: "Sign out",
      detail: "End this account session on this device.",
    },
  },
  explorerStats: {
    upcoming: "Upcoming trips",
    destinations: "Destinations",
    nextTrip: "Next trip",
  },
  explorerSearch: {
    label: "Search shared trips",
    mapPreviewLabel: "Shared trip map preview",
    owned: "Owned",
    placeholder: "Search city, trip, or role",
    shared: "Shared",
  },
  emptyStates: {
    trips: {
      title: "Create your first trip",
      detail: "Start with a shared route, dates, and owner settings.",
      action: "Create trip",
    },
    explorer: {
      title: "No shared trips yet",
      detail: "Shared trips from your account network will appear here.",
      noMatchesTitle: "No shared trips match this search",
      noMatchesDetail: "Try a different city, trip name, or role.",
      action: "Create trip",
    },
    todos: {
      title: "Create a trip to start shared to-dos",
      detail: "Trip tasks appear here after you create or join a trip.",
      action: "Create trip",
    },
  },
  vaultCreate: {
    kind: "Kind",
    note: "Note",
    file: "File",
    title: "Title *",
    detail: "Detail",
    externalUrl: "File link",
    personal: "Personal",
    submit: "Save to vault",
    success: "Saved to Travel Vault.",
    error: "Could not save vault item.",
    openExternal: "Open",
  },
} as const;
