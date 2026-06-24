export const itineraryBreakpoints = {
  tablet: 1199,
  mobile: 767,
} as const;

export const itineraryResponsiveClassNames = {
  timelineGridTablet: `max-[${itineraryBreakpoints.tablet}px]:grid-cols-1`,
  timelineGridMobileOverflow: `max-[${itineraryBreakpoints.mobile}px]:overflow-y-auto`,
  mapLayout: {
    tabletBorderRemoved: `max-[${itineraryBreakpoints.tablet}px]:border-0`,
    tabletPaddedRemoved: `max-[${itineraryBreakpoints.tablet}px]:p-0`,
  },
  mapCanvas: {
    tabletMinHeight: `max-[${itineraryBreakpoints.tablet}px]:min-h-[calc(100dvh-168px)]`,
    mobileHeight: `max-[${itineraryBreakpoints.mobile}px]:h-[calc(100dvh-48px)]`,
    mobileMinHeight: `max-[${itineraryBreakpoints.mobile}px]:min-h-0`,
  },
  overview: {
    heroTabletSingleColumn: `max-[${itineraryBreakpoints.tablet}px]:grid-cols-1`,
    cockpitTabletSingleColumn: `max-[${itineraryBreakpoints.tablet}px]:grid-cols-2`,
    travelCockpitDesktop: `grid-cols-3`,
  },
} as const;

export const stopDialogMoreDetailsLabel = {
  en: "More details",
  th: "รายละเอียดเพิ่มเติม",
} as const;

export type StopDialogLocale = keyof typeof stopDialogMoreDetailsLabel;
