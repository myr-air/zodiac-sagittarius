import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  meta?: ReactNode;
  aside?: ReactNode;
  motif?: ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, description, meta, aside, motif }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <h2>{subtitle}</h2> : null}
        {description ? <p className="page-header-description">{description}</p> : null}
        {meta ? <div className="page-header-meta">{meta}</div> : null}
      </div>
      {motif ? <div className="page-header-motif">{motif}</div> : null}
      {aside}
    </header>
  );
}

interface PageUserCardProps {
  color: string;
  label: string;
  name: string;
}

export function PageUserCard({ color, label, name }: PageUserCardProps) {
  return (
    <div className="page-current-user">
      <span className="person-avatar" style={{ backgroundColor: color }} aria-hidden="true">
        {name.slice(0, 1)}
      </span>
      <div>
        <strong>{name}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function formatTripRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return `${start.getDate()}–${end.getDate()} ${formatThaiMonth(end)} ${end.getFullYear()}`;
}

function formatThaiMonth(date: Date): string {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return months[date.getMonth()] ?? "";
}
