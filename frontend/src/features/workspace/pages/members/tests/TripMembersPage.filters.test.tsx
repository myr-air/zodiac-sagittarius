import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderMembersPage } from "../testing/support/render-members-page";

describe("TripMembersPage filters", () => {
  it("resets filters and ignores empty member submissions", async () => {
    const user = userEvent.setup();
    const props = renderMembersPage();

    await user.type(screen.getByLabelText(/ค้นหาสมาชิก/i), "Family");
    await user.selectOptions(screen.getByLabelText(/^สถานะ$/i), "disabled");
    expect(screen.getByText(/ไม่พบสมาชิกที่ตรงกับตัวกรอง/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^สิทธิ์$/i), "viewer");
    expect(screen.getByText(/ไม่พบสมาชิกที่ตรงกับตัวกรอง/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/ค้นหาสมาชิก/i));
    await user.selectOptions(screen.getByLabelText(/^สิทธิ์$/i), "all");
    await user.selectOptions(screen.getByLabelText(/^สถานะ$/i), "claimed");
    expect(screen.getByText(/Demo Traveler/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^สถานะ$/i), "pending");
    expect(screen.getAllByText(/Family Member/i).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: /ล้างตัวกรอง/i })[0]);
    expect(screen.getAllByText(/Family Member/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i }));
    fireEvent.submit(screen.getByLabelText(/ชื่อสมาชิกใหม่/i).closest("form")!);

    expect(props.onCreateMember).not.toHaveBeenCalled();
  });

  it("renders read-only member controls without management actions", () => {
    const props = renderMembersPage({ canManagePeople: false });

    expect(screen.queryByRole("button", { name: /คัดลอกลิงก์เชิญ/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ล้างตัวกรอง/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("อ่านอย่างเดียว");
    expect(props.onCreateMember).not.toHaveBeenCalled();
  });
});
