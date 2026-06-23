export const workspaceCopyFeedbackFrameClassName =
  "inline-flex items-center justify-center border border-(--color-border) text-xs font-extrabold leading-4 text-(--color-text-muted)";

export const workspaceCopyFeedbackStatusClassName =
  "data-[state=copied]:border-(--color-success-border) data-[state=copied]:bg-(--color-success-soft) data-[state=copied]:text-(--color-success) data-[state=error]:border-(--color-danger-border) data-[state=error]:bg-(--color-danger-soft) data-[state=error]:text-(--color-danger)";

export const workspaceCopyFeedbackTextStatusClassName =
  "data-[state=copied]:text-(--color-success) data-[state=error]:text-(--color-danger)";

export const workspaceCopyFeedbackCompactBadgeClassName =
  `min-h-8 rounded-(--radius-sm) bg-(--color-surface) px-2 ${workspaceCopyFeedbackFrameClassName} ${workspaceCopyFeedbackStatusClassName}`;

export const workspaceCopyFeedbackSubtleBadgeClassName =
  `min-h-9 rounded-(--radius-sm) bg-(--color-surface-subtle) px-3 ${workspaceCopyFeedbackFrameClassName} ${workspaceCopyFeedbackStatusClassName}`;

export const workspaceCopyFeedbackPillClassName =
  `min-h-8 rounded-full bg-(--color-surface-subtle) px-3 ${workspaceCopyFeedbackFrameClassName} ${workspaceCopyFeedbackTextStatusClassName}`;
