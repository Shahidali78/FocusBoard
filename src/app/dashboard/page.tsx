import { redirect } from "next/navigation";
import { BoardDashboard } from "@/components/dashboard/board-dashboard";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";

type Props = {
  searchParams: Promise<{ project?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const user = await requireUser();
  const { project } = await searchParams;
  const data = await getDashboardData(user.id, project);
  if (!data) redirect("/register");

  const boardVersion = data.project.columns
    .flatMap((column) => column.tasks)
    .map((task) => `${task.id}:${task.updatedAt}`)
    .join("|");

  return (
    <BoardDashboard
      key={`${data.project.id}:${boardVersion}`}
      data={data}
      currentUser={user}
    />
  );
}
