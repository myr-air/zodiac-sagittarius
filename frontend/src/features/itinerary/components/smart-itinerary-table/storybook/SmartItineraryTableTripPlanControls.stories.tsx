import { useState, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { messages } from "@/src/i18n/messages";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { SmartItineraryTableTripPlanControls } from "../SmartItineraryTableTripPlanControls";

const tripPlans = tripFixture.trip.planVariants;
const selectedTripPlanId = tripPlans[0]?.id ?? "plan-main";
type TripPlanControlsProps = ComponentProps<typeof SmartItineraryTableTripPlanControls>;

const tripPlanControlActions = {
  onChangeTripPlan: fn(),
  onChangeTripPlanStatus: fn(),
  onCreateTripPlan: fn(),
  onRenameTripPlan: fn(),
  onSetMainTripPlan: fn(),
};

const tripPlanControlArgs = {
  canManageTripPlans: true,
  itineraryLabels: messages.en.itinerary,
  isTripPlanBusy: false,
  mainTripPlanId: tripFixture.trip.activePlanVariantId,
  selectedTripPlanId,
  tripPlans,
  ...tripPlanControlActions,
} satisfies TripPlanControlsProps;

const renderTripPlanControls = (args: Partial<TripPlanControlsProps>) => (
  <div className="w-[360px]">
    <SmartItineraryTableTripPlanControls {...tripPlanControlArgs} {...args} />
  </div>
);

const StoryRenderer = (args: TripPlanControlsProps) => {
  const [selectedId, setSelectedId] = useState(args.selectedTripPlanId);

  return (
    <div className="w-[360px]">
      <SmartItineraryTableTripPlanControls
        {...args}
        onChangeTripPlan={setSelectedId}
        selectedTripPlanId={selectedId}
      />
    </div>
  );
};

const meta = {
  title: "Features/Itinerary/SmartItineraryTableTripPlanControls",
  component: SmartItineraryTableTripPlanControls,
  parameters: { layout: "centered" },
  render: StoryRenderer,
  args: tripPlanControlArgs,
} satisfies Meta<typeof SmartItineraryTableTripPlanControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: tripPlanControlArgs,
};

export const ReadOnly: Story = {
  args: {
    ...tripPlanControlArgs,
    canManageTripPlans: false,
    tripPlans: tripPlans.slice(0, 1),
  },
  render: renderTripPlanControls,
};
