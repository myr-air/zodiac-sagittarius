import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { seedTrip } from "@/src/trip/seed";
import { TripJoinParticipantAuthForm } from "../forms/TripJoinParticipantAuthForm";
import type {
  TripJoinParticipantAuthFormCopy,
  TripJoinParticipantAuthFormProps,
} from "../forms/TripJoinParticipantAuthForm";

const authFormCopy: TripJoinParticipantAuthFormCopy = {
  confirm: "Confirm",
  hideParticipantPassword: "Hide participant password",
  participantHelp: "Set a private password so only you can use this trip identity.",
  participantPassword: ({ name }) => `${name}'s password`,
  setParticipantPassword: ({ name }) => `Set password for ${name}`,
  showParticipantPassword: "Show participant password",
  start: "Start",
};

type AuthFormStoryArgs = TripJoinParticipantAuthFormProps;

const StoryRenderer = (args: AuthFormStoryArgs) => {
  const [participantPassword, setParticipantPassword] = useState(
    args.participantPassword,
  );
  const [showParticipantPassword, setShowParticipantPassword] = useState(
    args.showParticipantPassword,
  );

  return (
    <div className="w-[min(360px,calc(100vw-32px))]">
      <TripJoinParticipantAuthForm
        {...args}
        participantPassword={participantPassword}
        showParticipantPassword={showParticipantPassword}
        onParticipantPasswordChange={setParticipantPassword}
        onSubmitParticipant={(event) => {
          event.preventDefault();
          args.onSubmitParticipant(event);
        }}
        onToggleParticipantPassword={() => {
          setShowParticipantPassword((current) => !current);
          args.onToggleParticipantPassword();
        }}
      />
    </div>
  );
};

const meta = {
  title: "Features/Account/Trip Join Participant Auth Form",
  component: TripJoinParticipantAuthForm,
  parameters: { layout: "centered" },
  render: StoryRenderer,
  args: {
    copy: authFormCopy,
    isSubmitting: false,
    isTripAccessVariant: false,
    participantPassword: "",
    selectedMember: seedTrip.members[1],
    showParticipantPassword: false,
    onParticipantPasswordChange: fn(),
    onSubmitParticipant: fn(),
    onToggleParticipantPassword: fn(),
  },
} satisfies Meta<typeof TripJoinParticipantAuthForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstEntry: Story = {};

export const ExistingParticipant: Story = {
  args: {
    selectedMember: {
      ...seedTrip.members[1],
      claimPasswordHash: "storybook-hash",
    },
  },
};

export const TripAccessSubmitting: Story = {
  args: {
    isSubmitting: true,
    isTripAccessVariant: true,
    participantPassword: "traveler-pin",
  },
};
