import { describe, expect, it } from "vitest";

import {
  beginDayTitleEditorSave,
  completeDayTitleEditorSave,
  endDayTitleEditorSave,
  initialDayTitleEditorState,
  revertDayTitleEditorDraft,
  updateDayTitleEditorDraft,
} from "../day-title-editor-state";

describe("day title editor state", () => {
  it("initializes draft and source title within the maximum length", () => {
    expect(initialDayTitleEditorState("Border crossing", 8)).toEqual({
      draft: "Border c",
      saving: false,
      sourceTitle: "Border c",
    });
  });

  it("updates draft without changing source title or saving state", () => {
    expect(
      updateDayTitleEditorDraft(
        {
          draft: "Old title",
          saving: true,
          sourceTitle: "Old title",
        },
        "Draft title",
      ),
    ).toEqual({
      draft: "Draft title",
      saving: true,
      sourceTitle: "Old title",
    });
  });

  it("reverts draft to the last saved source title", () => {
    expect(
      revertDayTitleEditorDraft({
        draft: "Draft title",
        saving: false,
        sourceTitle: "Old title",
      }),
    ).toEqual({
      draft: "Old title",
      saving: false,
      sourceTitle: "Old title",
    });
  });

  it("tracks save state and commits the new source title", () => {
    const saving = beginDayTitleEditorSave({
      draft: "Draft title",
      saving: false,
      sourceTitle: "Old title",
    });

    expect(saving).toEqual({
      draft: "Draft title",
      saving: true,
      sourceTitle: "Old title",
    });
    expect(completeDayTitleEditorSave(saving, "Saved title")).toEqual({
      draft: "Saved title",
      saving: false,
      sourceTitle: "Saved title",
    });
  });

  it("ends save state without changing draft or source title", () => {
    expect(
      endDayTitleEditorSave({
        draft: "Draft title",
        saving: true,
        sourceTitle: "Old title",
      }),
    ).toEqual({
      draft: "Draft title",
      saving: false,
      sourceTitle: "Old title",
    });
  });
});
