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
import {
  fieldControlClassName,
  fieldStackClassName,
  textAreaControlClassName,
  workspacePageBaseClassName,
  workspacePageKindClassNames,
  workspaceSurfaceClassName,
  workspaceSurfaceDensityClassNames,
  type WorkspacePageKind,
  type WorkspaceSurfaceDensity,
} from "./workspace-primitive-styles";

export {
  fieldControlClassName,
  fieldStackClassName,
  textAreaControlClassName,
  workspaceSurfaceClassName,
} from "./workspace-primitive-styles";

type WorkspaceSurfaceElement = "section" | "form" | "nav" | "aside" | "div";

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
