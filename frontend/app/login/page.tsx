import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function LoginPage() {
  return <SagittariusApp accessMode="account-login" requireJoin dataSource="api" />;
}
