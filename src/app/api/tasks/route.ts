import { apiErrorResponse, ApiError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { requireProjectAccess, validateTaskRelations } from "@/lib/authorization";
import { db } from "@/lib/db";
import { createTaskSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const input = createTaskSchema.parse(await request.json());
    const project = await requireProjectAccess(user.id, input.projectId);
    await validateTaskRelations(project.id, project.workspaceId, {
      columnId: input.columnId,
      assigneeId: input.assigneeId,
      labelIds: input.labelIds,
    });

    const column = await db.boardColumn.findFirst({
      where: { id: input.columnId, projectId: input.projectId },
      include: { _count: { select: { tasks: true } } },
    });
    if (!column) throw new ApiError("Board column not found", 404);

    const task = await db.task.create({
      data: {
        projectId: input.projectId,
        columnId: input.columnId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        assigneeId: input.assigneeId,
        reporterId: user.id,
        position: column._count.tasks,
        labels: {
          create: input.labelIds.map((labelId) => ({ labelId })),
        },
        activities: {
          create: {
            projectId: input.projectId,
            userId: user.id,
            type: "TASK_CREATED",
            message: `created "${input.title}"`,
          },
        },
      },
    });

    return Response.json({ task }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
