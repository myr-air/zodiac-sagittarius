import { SagittariusApp } from "@/src/app/SagittariusApp";

export default async function JoinPage({ params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = await params;
  return <SagittariusApp requireJoin dataSource="api" initialJoinCode={decodeURIComponent(joinCode)} />;
}
