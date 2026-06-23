import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { messages } from "@/src/i18n/messages";
import { accountSettings } from "../../../testing/account-access-panel-test-clients";
import { AccountTrustedDevicesList } from "../account-trusted-devices-list";

const classNames = {
  deviceList: "account-device-list",
  deviceRow: "account-device-row",
  empty: "account-empty",
};

describe("AccountTrustedDevicesList", () => {
  it("renders trusted devices with summaries and revoke controls", () => {
    const onRevokeDevice = vi.fn();

    render(
      <AccountTrustedDevicesList
        classNames={classNames}
        labels={messages.en.access.settings}
        locale="en"
        onRevokeDevice={onRevokeDevice}
        revokingDeviceId="device-current"
        trustedDevices={accountSettings.trustedDevices}
      />,
    );

    const currentDeviceRow = screen.getByText("Current MacBook").closest(".account-device-row");
    expect(screen.getByLabelText(messages.en.access.settings.trustedDevicesLabel)).toHaveClass(
      "account-device-list",
    );
    expect(currentDeviceRow).not.toBeNull();
    expect(within(currentDeviceRow as HTMLElement).getByText(/Safari/)).toBeVisible();
    expect(
      within(currentDeviceRow as HTMLElement).getByRole("button", {
        name: messages.en.access.settings.revoke,
      }),
    ).toBeDisabled();
  });

  it("renders the empty trusted devices state", () => {
    render(
      <AccountTrustedDevicesList
        classNames={classNames}
        labels={messages.en.access.settings}
        locale="en"
        onRevokeDevice={vi.fn()}
        revokingDeviceId={null}
        trustedDevices={[]}
      />,
    );

    expect(screen.getByText(messages.en.access.settings.noTrustedDevices)).toHaveClass(
      "account-empty",
    );
  });
});
