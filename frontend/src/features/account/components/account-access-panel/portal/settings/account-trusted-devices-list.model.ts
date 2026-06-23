import type { AccountSettings } from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import { formatDateTime } from "../../auth";

type TrustedDevice = AccountSettings["trustedDevices"][number];

export function trustedDeviceSummary(
  device: TrustedDevice,
  labels: Pick<Messages["access"]["settings"], "unknownBrowser">,
  locale: Locale,
): string {
  const seenAt = device.lastSeenAt ?? device.createdAt;
  return `${device.userAgent || labels.unknownBrowser} · ${formatDateTime(seenAt, locale)}`;
}
