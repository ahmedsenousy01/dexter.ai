import { getCurrentUser } from "@/server/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  return <div>{user?.email}</div>;
}
