import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { peoplePanelCopy } from "../people-panel.copy";
import { PeoplePanelPresencePill, PeoplePanelRowIdentity } from "../PeoplePanelRowStatus";

const traveler = seedTrip.members.find((member) => member.id === "member-nam")!;

describe("PeoplePanelRowStatus", () => {
  it("renders localized identity, role, and claim/access state", () => {
    render(
      <PeoplePanelRowIdentity
        copy={peoplePanelCopy("en")}
        currentMemberId="member-nam"
        joined={false}
        locale="en"
        member={traveler}
      />,
    );

    expect(screen.getByText("Explorer Friend (You)")).toBeInTheDocument();
    expect(screen.getByText("Traveler")).toBeInTheDocument();
    expect(screen.getByLabelText(/Status for Explorer Friend/i)).toHaveTextContent("Active");
    expect(screen.getByLabelText(/Status for Explorer Friend/i)).toHaveTextContent("Pending");
  });

  it("renders Thai current-member marker and disabled claimed states", () => {
    render(
      <PeoplePanelRowIdentity
        copy={peoplePanelCopy("th")}
        currentMemberId="member-nam"
        joined
        locale="th"
        member={{ ...traveler, accessStatus: "disabled" }}
      />,
    );

    expect(screen.getByText("Explorer Friend (คุณ)")).toBeInTheDocument();
    expect(screen.getByText("ผู้ร่วมเดินทาง")).toBeInTheDocument();
    expect(screen.getByLabelText(/Status for Explorer Friend/i)).toHaveTextContent("ปิดสิทธิ์");
    expect(screen.getByLabelText(/Status for Explorer Friend/i)).toHaveTextContent("ยืนยันแล้ว");
  });

  it("keeps read-only presence styling separate from management controls", () => {
    render(<PeoplePanelPresencePill member={{ ...traveler, presence: "online" }} />);

    expect(screen.getByText("ออนไลน์")).toHaveClass("presence-pill", "presence-pill--online");
  });
});
