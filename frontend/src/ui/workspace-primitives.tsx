import type {
  FormHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/src/lib/cn";

type WorkspaceSurfaceElement = "section" | "form" | "nav" | "aside" | "div";
type WorkspaceSurfaceDensity = "normal" | "compact";
type WorkspacePageKind = "standard" | "workspace";

const workspacePageBaseClassName = [
  "min-h-full",
  "min-w-0",
  "bg-transparent",
  "px-6",
  "py-[22px]",
  "pb-7",
  "max-[1199px]:px-0",
  "max-[1199px]:py-0",
  "max-[1199px]:pb-0",
];

const workspacePageKindClassNames = {
  standard: ["max-[1199px]:min-h-[calc(100dvh-48px)]"],
  workspace: [
    "grid",
    "grid-rows-[auto_minmax(0,1fr)]",
    "gap-3",
    "max-[1199px]:gap-0",
  ],
} satisfies Record<WorkspacePageKind, string[]>;

export const workspaceSurfaceClassName = [
  "rounded-(--radius-lg)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
  "max-[1199px]:rounded-none",
  "max-[1199px]:border-x-0",
  "max-[1199px]:border-t-0",
  "max-[1199px]:shadow-none",
];

const workspaceSurfaceDensityClassNames = {
  normal: ["p-4"],
  compact: ["p-3.5"],
} satisfies Record<WorkspaceSurfaceDensity, string[]>;

export const fieldControlClassName = [
  "min-h-10",
  "w-full",
  "rounded-(--radius-sm)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "px-3",
  "text-[13px]",
  "text-(--color-text)",
  "outline-none",
  "transition-[border-color,box-shadow]",
  "focus:border-(--color-route-border)",
  "focus:shadow-[0_0_0_3px_rgb(191_219_254_/_0.55)]",
  "disabled:bg-(--color-surface-muted)",
  "disabled:text-(--color-text-muted)",
];

export const textAreaControlClassName = [
  ...fieldControlClassName,
  "min-h-[88px]",
  "resize-y",
  "py-2",
  "leading-5",
];

export const fieldStackClassName = [
  "grid",
  "gap-1.5",
  "text-[12px]",
  "font-extrabold",
  "text-(--color-text)",
];

export function workspacePageClassName(kind: WorkspacePageKind = "standard", className = ""): string {
  return cn(workspacePageBaseClassName, workspacePageKindClassNames[kind], className);
}

export function WorkspacePage({
  children,
  className = "",
  kind = "standard",
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode; kind?: WorkspacePageKind }) {
  return (
    <section className={workspacePageClassName(kind, className)} {...props}>
      {children}
    </section>
  );
}

type WorkspaceSurfaceBaseProps = {
  as?: WorkspaceSurfaceElement;
  children: ReactNode;
  className?: string;
  density?: WorkspaceSurfaceDensity;
};

type WorkspaceSurfaceFormProps = Omit<WorkspaceSurfaceBaseProps, "as"> & {
  as: "form";
} & FormHTMLAttributes<HTMLFormElement>;

type WorkspaceSurfaceNonFormProps = WorkspaceSurfaceBaseProps & {
  as?: Exclude<WorkspaceSurfaceElement, "form">;
} & HTMLAttributes<HTMLElement>;

type WorkspaceSurfaceProps = WorkspaceSurfaceFormProps | WorkspaceSurfaceNonFormProps;

export function WorkspaceSurface({
  as,
  children,
  className = "",
  density = "normal",
  ...props
}: WorkspaceSurfaceProps) {
  const surfaceClassName = cn(workspaceSurfaceClassName, workspaceSurfaceDensityClassNames[density], className);

  if (as === "form") {
    return (
      <form className={surfaceClassName} {...(props as FormHTMLAttributes<HTMLFormElement>)}>
        {children}
      </form>
    );
  }

  if (as === "nav") {
    return (
      <nav className={surfaceClassName} {...(props as HTMLAttributes<HTMLElement>)}>
        {children}
      </nav>
    );
  }

  if (as === "aside") {
    return (
      <aside className={surfaceClassName} {...(props as HTMLAttributes<HTMLElement>)}>
        {children}
      </aside>
    );
  }

  if (as === "div") {
    return (
      <div className={surfaceClassName} {...(props as HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <section className={surfaceClassName} {...(props as HTMLAttributes<HTMLElement>)}>
      {children}
    </section>
  );
}

export function FieldLabel({ children, className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement> & { children: ReactNode }) {
  return (
    <label className={cn(fieldStackClassName, className)} {...props}>
      {children}
    </label>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldControlClassName, className)} {...props} />;
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(textAreaControlClassName, className)} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={cn(fieldControlClassName, className)} {...props}>
      {children}
    </select>
  );
}
