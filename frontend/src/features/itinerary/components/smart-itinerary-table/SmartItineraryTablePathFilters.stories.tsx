import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { messages } from "@/src/i18n/messages";
import { SmartItineraryTablePathFilters } from "./SmartItineraryTablePathFilters";
import type { ComponentProps } from "react";
import {
  mainPathOption,
  pathIdPlanA,
  pathIdPlanB,
  pathOptionPlanA,
  pathOptionPlanB,
} from "@/src/features/itinerary/testing";

const StoryRenderer = (args: ComponentProps<typeof SmartItineraryTablePathFilters>) => {
  const [selected, setSelected] = useState(new Set(args.selectedPathIds));
  const [showAllPaths, setShowAllPaths] = useState(args.showAllPaths);

  return (
    <div className="w-[360px]">
      <SmartItineraryTablePathFilters
        {...args}
        selectedPathIds={selected}
        showAllPaths={showAllPaths}
        onTogglePathFilter={(pathId) => {
          setSelected((current) => {
            const next = new Set(current);
            if (next.has(pathId)) next.delete(pathId);
            else next.add(pathId);
            return next;
          });
          args.onTogglePathFilter?.(pathId);
        }}
        onChangeShowAllPaths={(next) => {
          setShowAllPaths(next);
          args.onChangeShowAllPaths?.(next);
        }}
      />
    </div>
  );
};

const meta = {
  title: "Features/Itinerary/SmartItineraryTablePathFilters",
  component: SmartItineraryTablePathFilters,
  parameters: { layout: "centered" },
  render: StoryRenderer,
  args: {
    filterOptions: [
      mainPathOption,
      pathOptionPlanA,
      pathOptionPlanB,
    ],
    itineraryLabels: messages.en.itinerary,
    onTogglePathFilter: fn(),
    onChangeShowAllPaths: fn(),
    selectedFilterLabel: "3 selected",
    selectedPathIds: new Set([mainPathOption.id, pathIdPlanA, pathIdPlanB]),
    showAllPaths: false,
  },
} satisfies Meta<typeof SmartItineraryTablePathFilters>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    selectedFilterLabel: "3 selected",
  },
};

export const ShowAllEnabled: Story = {
  args: {
    showAllPaths: true,
    selectedFilterLabel: "all paths",
  },
};
