import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function NewTripPage() {
  return <SagittariusApp accessMode="account-login" requireJoin dataSource="api" />;
}
