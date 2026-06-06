import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";

export async function requireWorkspaceAccess(userId: string, workspaceId: string) {
  const membership = await db.membership.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new ApiError("Workspace not found", 404);
  }
  return membership;
}

export async function requireProjectAccess(userId: string, projectId: string) {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        memberships: {
          some: { userId },
        },
      },
    },
    include: {
      workspace: true,
    },
  });

  if (!project) {
    throw new ApiError("Project not found", 404);
  }
  return project;
}

export async function requireTaskAccess(userId: string, taskId: string) {
  const task = await db.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          memberships: {
            some: { userId },
          },
        },
      },
    },
    include: {
      project: true,
      column: true,
    },
  });

  if (!task) {
    throw new ApiError("Task not found", 404);
  }
  return task;
}

export async function validateTaskRelations(
  projectId: string,
  workspaceId: string,
  options: {
    columnId?: string;
    assigneeId?: string | null;
    labelIds?: string[];
  },
) {
  if (options.columnId) {
    const column = await db.boardColumn.findFirst({
      where: { id: options.columnId, projectId },
      select: { id: true },
    });
    if (!column) throw new ApiError("Board column not found", 404);
  }

  if (options.assigneeId) {
    const membership = await db.membership.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: options.assigneeId,
        },
      },
      select: { id: true },
    });
    if (!membership) throw new ApiError("Assignee is not a workspace member");
  }

  if (options.labelIds) {
    const uniqueLabelIds = [...new Set(options.labelIds)];
    const labelCount = await db.label.count({
      where: {
        projectId,
        id: { in: uniqueLabelIds },
      },
    });
    if (labelCount !== uniqueLabelIds.length) {
      throw new ApiError("One or more labels are invalid");
    }
  }
}
