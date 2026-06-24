import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { PanelHeading } from "../../primitives/account-panel-heading";

export function PortalSignOutSection({
  className,
  onLogout,
}: {
  className: string;
  onLogout: () => Promise<void>;
}) {
  const { t } = useI18n();

  return (
    <section className={className} id="portal-sign-out">
      <PanelHeading icon="x" title={t.access.portal.sections.signOut.title} detail={t.access.portal.sections.signOut.detail} />
      <Button type="button" variant="secondary" onClick={() => void onLogout()}>
        <Icon name="x" />
        {t.access.dashboard.logout}
      </Button>
    </section>
  );
}
