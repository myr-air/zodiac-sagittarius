"use client";

import type { AccountSettings } from "@/src/account/api-client";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import { formatDateTime } from "../auth";

interface AccountTrustedDevicesListClassNames {
  deviceList: string;
  deviceRow: string;
  empty: string;
}

export function AccountTrustedDevicesList({
  classNames,
  labels,
  locale,
  onRevokeDevice,
  revokingDeviceId,
  trustedDevices,
}: {
  classNames: AccountTrustedDevicesListClassNames;
  labels: Messages["access"]["settings"];
  locale: Locale;
  onRevokeDevice: (deviceId: string) => void;
  revokingDeviceId: string | null;
  trustedDevices: AccountSettings["trustedDevices"];
}) {
  return (
    <div className={classNames.deviceList} aria-label={labels.trustedDevicesLabel}>
      {trustedDevices.length ? (
        trustedDevices.map((device) => (
          <div className={classNames.deviceRow} key={device.id}>
            <div>
              <strong>{device.label}</strong>
              <span>
                {device.userAgent || labels.unknownBrowser} ·{" "}
                {device.lastSeenAt ? formatDateTime(device.lastSeenAt, locale) : formatDateTime(device.createdAt, locale)}
              </span>
            </div>
            <Button type="button" variant="secondary" onClick={() => onRevokeDevice(device.id)} disabled={revokingDeviceId === device.id}>
              <Icon name="x" />
              {labels.revoke}
            </Button>
          </div>
        ))
      ) : (
        <p className={classNames.empty}>{labels.noTrustedDevices}</p>
      )}
    </div>
  );
}
