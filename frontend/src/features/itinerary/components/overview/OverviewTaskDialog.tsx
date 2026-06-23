import type { FormEvent } from "react";
import { SelectOptions } from "@/src/shared/components/select-options";
import type { Trip, TripTask } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { Button, Select, TextInput } from "@/src/ui";
import {
  overviewTaskAssigneeSelectOptions,
  overviewTaskVisibilitySelectOptions,
} from "./overview-task-dialog-options";
import {
  dialogFieldWideClassName,
  modalBackdropClassName,
  taskDialogActionsClassName,
  taskDialogClassName,
  taskDialogFormClassName,
  taskDialogGridClassName,
  taskDialogTitleRowClassName,
} from "./overview-page.styles";

interface OverviewTaskDialogLabels {
  assigneeLabel: string;
  cancel: string;
  closeForm: string;
  noAssignee: string;
  private: string;
  shared: string;
  submit: string;
  title: string;
  titleLabel: string;
  titlePlaceholder: string;
  visibilityLabel: string;
}

interface OverviewTaskDialogProps {
  assignableMembers: Trip["members"];
  assigneeId: string;
  labels: OverviewTaskDialogLabels;
  onAssigneeChange: (assigneeId: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (title: string) => void;
  onVisibilityChange: (visibility: TripTask["visibility"]) => void;
  title: string;
  visibility: TripTask["visibility"];
}

export function OverviewTaskDialog({
  assignableMembers,
  assigneeId,
  labels,
  onAssigneeChange,
  onClose,
  onSubmit,
  onTitleChange,
  onVisibilityChange,
  title,
  visibility,
}: OverviewTaskDialogProps) {
  return (
    <div className={modalBackdropClassName} role="presentation">
      <section className={taskDialogClassName} role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
        <div className={taskDialogTitleRowClassName}>
          <h2 id="task-dialog-title">{labels.title}</h2>
          <button type="button" aria-label={labels.closeForm} onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <form className={taskDialogFormClassName} onSubmit={onSubmit}>
          <div className={taskDialogGridClassName}>
            <label className={dialogFieldWideClassName}>
              <span>{labels.titleLabel}</span>
              <TextInput value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder={labels.titlePlaceholder} />
            </label>
            <label>
              <span>{labels.visibilityLabel}</span>
              <Select value={visibility} onChange={(event) => onVisibilityChange(event.target.value as TripTask["visibility"])}>
                <SelectOptions
                  options={overviewTaskVisibilitySelectOptions({
                    private: labels.private,
                    shared: labels.shared,
                  })}
                />
              </Select>
            </label>
            <label>
              <span>{labels.assigneeLabel}</span>
              <Select value={assigneeId} disabled={visibility === "private"} onChange={(event) => onAssigneeChange(event.target.value)}>
                <SelectOptions
                  options={overviewTaskAssigneeSelectOptions(
                    assignableMembers,
                    labels.noAssignee,
                  )}
                />
              </Select>
            </label>
          </div>

          <div className={taskDialogActionsClassName}>
            <Button type="button" variant="ghost" onClick={onClose}>{labels.cancel}</Button>
            <Button type="submit" disabled={!title.trim()}>{labels.submit}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
