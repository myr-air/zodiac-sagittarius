import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ActionBar, Button, FloatingActionButton, Icon, IconButton, SegmentedControl, Select, SwapButton, TextInput } from "@/src/ui";
import { cssCheckPlay } from "./ui.stories.plays";

const buttonsMeta = {
  title: "Design System/Buttons",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof Button>;

export default buttonsMeta;

type ButtonStory = StoryObj<typeof buttonsMeta>;

export const Primary: ButtonStory = { args: { children: "วางแผนทริป", variant: "primary" } };
export const Secondary: ButtonStory = { args: { children: "ดูรายละเอียด", variant: "secondary" } };
export const Ghost: ButtonStory = { args: { children: "ยกเลิก", variant: "ghost" } };
export const Danger: ButtonStory = { args: { children: "ลบรายการ", variant: "danger" } };
export const Disabled: ButtonStory = { args: { children: "กำลังบันทึก", variant: "primary", disabled: true } };
export const LongThaiLabel: ButtonStory = {
  args: { children: "บันทึกแผนทริปทั้งหมดให้เพื่อนเห็นพร้อมกัน", variant: "secondary" },
};
export const Mobile: ButtonStory = {
  args: { children: "เปิดทริป", variant: "primary" },
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
export const CssCheck: ButtonStory = {
  args: { children: "Submit", variant: "primary" },
  play: cssCheckPlay,
};

export const IconOnly: ButtonStory = {
  render: () => (
    <IconButton aria-label="เปิดรายละเอียด">
      <Icon name="panel" />
    </IconButton>
  ),
};

export const Controls: ButtonStory = {
  render: () => (
    <div className="grid w-[min(720px,calc(100vw-32px))] gap-4 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
      <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
        <label className="grid gap-1.5 text-xs font-extrabold text-(--color-text)">
          Search
          <TextInput placeholder="Find booking, stop, or member" />
        </label>
        <label className="grid gap-1.5 text-xs font-extrabold text-(--color-text)">
          Status
          <Select defaultValue="open">
            <option value="open">Open</option>
            <option value="done">Done</option>
          </Select>
        </label>
      </div>
      <SegmentedControl
        aria-label="Trip scope"
        value="trip"
        options={[
          { value: "mine", label: "Mine" },
          { value: "trip", label: "Trip" },
          { value: "all", label: "All" },
        ]}
        onChange={() => undefined}
      />
      <ActionBar aria-label="Control actions">
        <Button variant="ghost">Cancel</Button>
        <SwapButton aria-label="Swap dates">
          <Icon name="redo" />
        </SwapButton>
        <Button>Save changes</Button>
      </ActionBar>
      <FloatingActionButton type="button" className="static justify-self-start">
        <Icon name="plus" />
        Add item
      </FloatingActionButton>
    </div>
  ),
};
