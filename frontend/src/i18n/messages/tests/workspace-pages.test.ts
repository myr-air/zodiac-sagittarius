import { describe, expect, it } from "vitest";

import {
  enContextRailMessages,
  enMapMessages,
  enMembersMessages,
  enStopDialogMessages,
  enSuggestionsMessages,
  enTimelineMessages,
} from "../en.workspace-pages";
import { enContextRailMessages as enContextRailSectionMessages } from "../en.workspace-pages.context-rail";
import { enMapMessages as enMapSectionMessages } from "../en.workspace-pages.map";
import { enMembersMessages as enMembersSectionMessages } from "../en.workspace-pages.members";
import { enStopDialogMessages as enStopDialogSectionMessages } from "../en.workspace-pages.stop-dialog";
import { enSuggestionsMessages as enSuggestionsSectionMessages } from "../en.workspace-pages.suggestions";
import { enTimelineMessages as enTimelineSectionMessages } from "../en.workspace-pages.timeline";
import {
  thContextRailMessages,
  thMapMessages,
  thMembersMessages,
  thStopDialogMessages,
  thSuggestionsMessages,
  thTimelineMessages,
} from "../th.workspace-pages";
import { thContextRailMessages as thContextRailSectionMessages } from "../th.workspace-pages.context-rail";
import { thMapMessages as thMapSectionMessages } from "../th.workspace-pages.map";
import { thMembersMessages as thMembersSectionMessages } from "../th.workspace-pages.members";
import { thStopDialogMessages as thStopDialogSectionMessages } from "../th.workspace-pages.stop-dialog";
import { thSuggestionsMessages as thSuggestionsSectionMessages } from "../th.workspace-pages.suggestions";
import { thTimelineMessages as thTimelineSectionMessages } from "../th.workspace-pages.timeline";

describe("workspace page messages", () => {
  it("keeps workspace page copy split behind stable aggregate exports", () => {
    expect(enMapMessages).toBe(enMapSectionMessages);
    expect(enTimelineMessages).toBe(enTimelineSectionMessages);
    expect(enMembersMessages).toBe(enMembersSectionMessages);
    expect(enContextRailMessages).toBe(enContextRailSectionMessages);
    expect(enStopDialogMessages).toBe(enStopDialogSectionMessages);
    expect(enSuggestionsMessages).toBe(enSuggestionsSectionMessages);

    expect(thMapMessages).toBe(thMapSectionMessages);
    expect(thTimelineMessages).toBe(thTimelineSectionMessages);
    expect(thMembersMessages).toBe(thMembersSectionMessages);
    expect(thContextRailMessages).toBe(thContextRailSectionMessages);
    expect(thStopDialogMessages).toBe(thStopDialogSectionMessages);
    expect(thSuggestionsMessages).toBe(thSuggestionsSectionMessages);
  });

  it("keeps localized workspace labels available through the aggregate modules", () => {
    expect(enMapMessages.title).toBe("Map");
    expect(thMapMessages.title).toBe("แผนที่");
    expect(enMembersMessages.actions.copyInvite).toBe("Copy invite link");
    expect(thMembersMessages.actions.copyInvite).toBe("คัดลอกลิงก์เชิญ");
    expect(enStopDialogMessages.titles.create).toBe("Add activity");
    expect(thStopDialogMessages.titles.create).toBe("เพิ่มกิจกรรม");
  });
});
