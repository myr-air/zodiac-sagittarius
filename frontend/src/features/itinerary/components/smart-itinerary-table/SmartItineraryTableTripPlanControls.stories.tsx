import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { messages } from "@/src/i18n/messages";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { SmartItineraryTableTripPlanControls } from "./SmartItineraryTableTripPlanControls";

const tripPlans = tripFixture.trip.planVariants;

const StoryRenderer = () => {
  const [selectedTripPlanId, setSelectedTripPlanId] = useState(tripPlans[0]?.id ?? "plan-main");

  return (
    <div className="w-[360px]">
      <SmartItineraryTableTripPlanControls
        canManageTripPlans
        itineraryLabels={messages.en.itinerary}
        isTripPlanBusy={false}
        mainTripPlanId={tripFixture.trip.activePlanVariantId}
        onChangeTripPlan={setSelectedTripPlanId}
        onChangeTripPlanStatus={fn()}
        onCreateTripPlan={fn()}
        onRenameTripPlan={fn()}
        onSetMainTripPlan={fn()}
        selectedTripPlanId={selectedTripPlanId}
        tripPlans={tripPlans}
      />
    </div>
  );
};

const meta = {
  title: "Features/Itinerary/SmartItineraryTableTripPlanControls",
  component: SmartItineraryTableTripPlanControls,
  parameters: { layout: "centered" },
  render: StoryRenderer,
  args: {
    canManageTripPlans: true,
    itineraryLabels: messages.en.itinerary,
    isTripPlanBusy: false,
    mainTripPlanId: tripFixture.trip.activePlanVariantId,
    onChangeTripPlan: fn(),
    onChangeTripPlanStatus: fn(),
    onCreateTripPlan: fn(),
    onRenameTripPlan: fn(),
    onSetMainTripPlan: fn(),
    selectedTripPlanId: tripPlans[0]?.id ?? "plan-main",
    tripPlans,
  },
} satisfies Meta<typeof SmartItineraryTableTripPlanControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    canManageTripPlans: true,
    itineraryLabels: messages.en.itinerary,
    isTripPlanBusy: false,
    mainTripPlanId: tripFixture.trip.activePlanVariantId,
    onChangeTripPlan: fn(),
    onChangeTripPlanStatus: fn(),
    onCreateTripPlan: fn(),
    onRenameTripPlan: fn(),
    onSetMainTripPlan: fn(),
    selectedTripPlanId: tripPlans[0]?.id ?? "plan-main",
    tripPlans,
  },
};

export const ReadOnly: Story = {
  args: {
    canManageTripPlans: false,
    itineraryLabels: messages.en.itinerary,
    isTripPlanBusy: false,
    mainTripPlanId: tripFixture.trip.activePlanVariantId,
    onChangeTripPlan: fn(),
    onChangeTripPlanStatus: fn(),
    onCreateTripPlan: fn(),
    onRenameTripPlan: fn(),
    onSetMainTripPlan: fn(),
    selectedTripPlanId: tripPlans[0]?.id ?? "plan-main",
    tripPlans: tripPlans.slice(0, 1),
  },
  render: () => (
    <div className="w-[360px]">
      <SmartItineraryTableTripPlanControls
        canManageTripPlans={false}
        itineraryLabels={messages.en.itinerary}
        isTripPlanBusy={false}
        mainTripPlanId={tripFixture.trip.activePlanVariantId}
        onChangeTripPlan={fn()}
        onChangeTripPlanStatus={fn()}
        onCreateTripPlan={fn()}
        onRenameTripPlan={fn()}
        onSetMainTripPlan={fn()}
        selectedTripPlanId={tripPlans[0]?.id ?? "plan-main"}
        tripPlans={tripPlans.slice(0, 1)}
      />
    </div>
  ),
};
