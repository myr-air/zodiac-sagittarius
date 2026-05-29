import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function MembersPage() {
  return <SagittariusApp initialView="members" requireJoin dataSource="api" />;
}
