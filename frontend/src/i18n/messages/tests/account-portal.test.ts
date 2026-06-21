import { describe, expect, it } from "vitest";

import { enAccountPortalMessages } from "../en.account-portal";
import { enAccountPortalDashboardMessages } from "../en.account-portal.dashboard";
import { enAccountPortalPortalMessages } from "../en.account-portal.portal";
import { enAccountPortalSettingsMessages } from "../en.account-portal.settings";
import { thAccountPortalMessages } from "../th.account-portal";
import { thAccountPortalDashboardMessages } from "../th.account-portal.dashboard";
import { thAccountPortalPortalMessages } from "../th.account-portal.portal";
import { thAccountPortalSettingsMessages } from "../th.account-portal.settings";

describe("account portal messages", () => {
  it("keeps account portal locale sections split behind stable aggregate exports", () => {
    expect(enAccountPortalMessages.portal).toBe(enAccountPortalPortalMessages);
    expect(enAccountPortalMessages.dashboard).toBe(enAccountPortalDashboardMessages);
    expect(enAccountPortalMessages.settings).toBe(enAccountPortalSettingsMessages);

    expect(thAccountPortalMessages.portal).toBe(thAccountPortalPortalMessages);
    expect(thAccountPortalMessages.dashboard).toBe(thAccountPortalDashboardMessages);
    expect(thAccountPortalMessages.settings).toBe(thAccountPortalSettingsMessages);
  });

  it("keeps localized account portal copy available through the aggregate modules", () => {
    expect(enAccountPortalMessages.portal.nav.dashboard).toBe("Dashboard");
    expect(thAccountPortalMessages.portal.nav.dashboard).toBe("แดชบอร์ด");
    expect(enAccountPortalMessages.dashboard.noEmail).toBe("No email loaded");
    expect(thAccountPortalMessages.dashboard.noEmail).toBe("ยังไม่ได้โหลดอีเมล");
    expect(enAccountPortalMessages.settings.form.displayName).toBe("Display name *");
    expect(thAccountPortalMessages.settings.form.displayName).toBe("ชื่อที่แสดง *");
  });
});
