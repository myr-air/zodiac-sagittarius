export const requiredSupportingPageStates: Array<[string, string[]]> = [
  [
    "shared/components/people-panel/storybook/PeoplePanel.stories.tsx",
    ["Manager", "ReadOnly", "Empty"],
  ],
  [
    "shared/components/suggestion-panel/storybook/SuggestionPanel.stories.tsx",
    ["Default", "Thai", "Empty", "ConflictedHeavy"],
  ],
  [
    "shared/components/date-time-pickers/storybook/DateTimePickers.stories.tsx",
    [
      "TimePicker",
      "DatePicker",
      "DateTimePicker",
      "Disabled",
      "Mobile",
      "Tablet",
      "Thai",
      "Desktop1024",
      "Desktop1440",
    ],
  ],
  [
    "shared/components/weather/storybook/WeatherBriefingDrawer.stories.tsx",
    ["OrganizerDrawer", "TravelerDrawer", "MobileSheet", "PartialData"],
  ],
  [
    "shared/components/weather/storybook/WeatherForecastStrip.stories.tsx",
    ["AtmosphericGlass", "MobileOverflow", "Thai", "Empty"],
  ],
  [
    "features/workspace/components/summary-stat/storybook/WorkspaceSummaryStat.stories.tsx",
    ["Default", "Positive", "Negative"],
  ],
  [
    "features/public-site/pages/home/storybook/HomeLanding.stories.tsx",
    ["PixelPerfect", "Thai", "Tablet", "Mobile", "Desktop1024", "Desktop1440"],
  ],
  [
    "features/account/components/account-access-panel/storybook/AccountAccessPanel.stories.tsx",
    [
      "AccountLogin",
      "AccountRegister",
      "AccountLoginThai",
      "TripAccess",
      "PortalDashboard",
      "NewTripBuilder",
      "NewTripMobile",
      "AccountLoginTablet",
      "AccountLoginDesktop1024",
      "AccountLoginDesktop1440",
      "TripAccessTablet",
      "TripAccessDesktop1024",
      "TripAccessDesktop1440",
      "NewTripTablet",
      "NewTripDesktop1024",
      "NewTripDesktop1440",
    ],
  ],
  [
    "features/account/components/account-access-panel/portal/account-portal-primitives.stories.tsx",
    ["Overview", "ThaiEmpty"],
  ],
];
