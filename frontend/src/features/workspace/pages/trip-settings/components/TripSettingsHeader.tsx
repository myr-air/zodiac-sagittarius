import {
  PageHeader,
  PageHeaderMetaItem,
} from "@/src/shared/components/page-header";

interface TripSettingsHeaderProps {
  description: string;
  roleLabel: string;
  subtitle: string;
  title: string;
}

export function TripSettingsHeader({
  description,
  roleLabel,
  subtitle,
  title,
}: TripSettingsHeaderProps) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      description={description}
      meta={<PageHeaderMetaItem icon="settings">{roleLabel}</PageHeaderMetaItem>}
    />
  );
}
