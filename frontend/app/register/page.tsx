import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function RegisterPage() {
  return <SagittariusApp accessMode="account-register" requireJoin dataSource="api" />;
}
