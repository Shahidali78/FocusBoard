import { db } from "@/lib/db";
import type { DashboardData } from "@/types/board";

export async function getDashboardData(
  userId: string,
  requestedProjectId?: string,
): Promise<DashboardData | null> {
  const membership = await db.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      workspace: {
        include: {
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarColor: true,
                },
              },
            },
          },
          projects: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "asc" },
            include: {
              _count: { select: { tasks: true } },
            },
          },
        },
      },
    },
  });

  if (!membership || membership.workspace.projects.length === 0) return null;

  const selected =
    membership.workspace.projects.find((project) => project.id === requestedProjectId) ??
    membership.workspace.projects[0];

  const project = await db.project.findUnique({
    where: { id: selected.id },
    include: {
      labels: { orderBy: { name: "asc" } },
      columns: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarColor: true,
                },
              },
              reporter: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarColor: true,
                },
              },
              labels: {
                include: { label: true },
              },
              _count: { select: { comments: true } },
            },
          },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarColor: true,
            },
          },
          task: { select: { title: true } },
        },
      },
    },
  });

  if (!project) return null;

  return {
    workspace: {
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
    },
    projects: membership.workspace.projects.map((item) => ({
      id: item.id,
      name: item.name,
      key: item.key,
      color: item.color,
      taskCount: item._count.tasks,
    })),
    members: membership.workspace.memberships.map((item) => item.user),
    project: {
      id: project.id,
      name: project.name,
      key: project.key,
      description: project.description,
      color: project.color,
      workspaceId: project.workspaceId,
      labels: project.labels,
      columns: project.columns.map((column) => ({
        id: column.id,
        name: column.name,
        color: column.color,
        position: column.position,
        tasks: column.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate?.toISOString() ?? null,
          position: task.position,
          columnId: task.columnId,
          assignee: task.assignee,
          reporter: task.reporter,
          labels: task.labels.map((item) => item.label),
          commentCount: task._count.comments,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        })),
      })),
    },
    activities: project.activities.map((activity) => ({
      id: activity.id,
      message: activity.message,
      type: activity.type,
      createdAt: activity.createdAt.toISOString(),
      user: activity.user,
      taskTitle: activity.task?.title ?? null,
    })),
  };
}
