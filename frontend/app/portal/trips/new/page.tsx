import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function PortalNewTripPage() {
  return <SagittariusApp accessMode="account-portal" portalSection="new-trip" requireJoin dataSource="api" />;
}
