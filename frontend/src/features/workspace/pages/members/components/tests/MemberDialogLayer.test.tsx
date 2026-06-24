import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getMessages } from "@/src/i18n/messages";
import { seedTrip } from "@/src/trip/seed";
import { MemberDialogLayer } from "../MemberDialogLayer";

const member = seedTrip.members[0];
const labels = getMessages("th").members.confirm;

describe("MemberDialogLayer", () => {
  it("does not render a dialog without an active member task", () => {
    render(
      <MemberDialogLayer
        dialog={null}
        labels={labels}
        passwordError={null}
        passwordValue=""
        onCancel={vi.fn()}
        onPasswordChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the active member task dialog", () => {
    render(
      <MemberDialogLayer
        dialog={{ kind: "password", member }}
        labels={labels}
        passwordError="รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร"
        passwordValue="123"
        onCancel={vi.fn()}
        onPasswordChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", {
        name: `เปลี่ยนรหัสผ่าน ${member.displayName}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร",
    );
  });
});
