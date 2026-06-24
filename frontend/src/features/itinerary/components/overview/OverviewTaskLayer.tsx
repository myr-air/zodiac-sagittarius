import type { FormEvent } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Member, TripTask } from "@/src/trip/types";
import { OverviewTaskDialog } from "./OverviewTaskDialog";
import { overviewUndoToastClassName } from "./overview-page.styles";

interface OverviewTaskLayerProps {
  assignableMembers: Member[];
  assigneeId: string;
  isOpen: boolean;
  onAssigneeChange: (memberId: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (title: string) => void;
  onUndoTaskToggle: () => void;
  onVisibilityChange: (visibility: TripTask["visibility"]) => void;
  title: string;
  undoTask: TripTask | null;
  visibility: TripTask["visibility"];
}

export function OverviewTaskLayer({
  assignableMembers,
  assigneeId,
  isOpen,
  onAssigneeChange,
  onClose,
  onSubmit,
  onTitleChange,
  onUndoTaskToggle,
  onVisibilityChange,
  title,
  undoTask,
  visibility,
}: OverviewTaskLayerProps) {
  const { t } = useI18n();

  return (
    <>
      {isOpen ? (
        <OverviewTaskDialog
          assignableMembers={assignableMembers}
          assigneeId={assigneeId}
          labels={{
            assigneeLabel: t.overview.task.assigneeLabel,
            cancel: t.overview.task.cancel,
            closeForm: t.overview.task.closeForm,
            noAssignee: t.overview.task.noAssignee,
            private: t.overview.task.private,
            shared: t.overview.task.shared,
            submit: t.overview.task.submit,
            title: t.overview.headings.addChecklist,
            titleLabel: t.overview.task.titleLabel,
            titlePlaceholder: t.overview.task.titlePlaceholder,
            visibilityLabel: t.overview.task.visibilityLabel,
          }}
          onAssigneeChange={onAssigneeChange}
          onClose={onClose}
          onSubmit={onSubmit}
          onTitleChange={onTitleChange}
          onVisibilityChange={onVisibilityChange}
          title={title}
          visibility={visibility}
        />
      ) : null}
      {undoTask ? (
        <div className={overviewUndoToastClassName} role="status">
          <span>{t.overview.task.changed({ title: undoTask.title })}</span>
          <button type="button" onClick={onUndoTaskToggle}>{t.overview.task.undo}</button>
        </div>
      ) : null}
    </>
  );
}
