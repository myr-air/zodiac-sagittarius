import { SagittariusApp } from "@/src/app/SagittariusApp";

interface JoinPageProps {
  searchParams?: Promise<{ token?: string }>;
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams;
  return <SagittariusApp accessMode="trip-access" requireJoin dataSource="api" initialJoinToken={params?.token ?? null} />;
}
