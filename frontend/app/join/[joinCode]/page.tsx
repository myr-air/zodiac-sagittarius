import { SagittariusApp } from "@/src/app/SagittariusApp";

export default async function JoinPage({ params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = await params;
  const decodedJoinCode = decodeURIComponent(joinCode);
  return <SagittariusApp accessMode="trip-access" requireJoin dataSource="api" initialJoinCode={decodedJoinCode} />;
}
