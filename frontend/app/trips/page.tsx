import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function TripsPage() {
  return <SagittariusApp accessMode="account-login" requireJoin dataSource="api" />;
}
