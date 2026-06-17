import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { messages } from "@/src/i18n/messages";
import { SmartItineraryTablePathFilters } from "./SmartItineraryTablePathFilters";
import type { ComponentProps } from "react";

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
      { id: "main", name: "Main" },
      { id: "plan-a", name: "Plan A" },
      { id: "plan-b", name: "Plan B" },
    ],
    itineraryLabels: messages.en.itinerary,
    onTogglePathFilter: fn(),
    onChangeShowAllPaths: fn(),
    selectedFilterLabel: "3 selected",
    selectedPathIds: new Set(["main", "plan-a", "plan-b"]),
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
