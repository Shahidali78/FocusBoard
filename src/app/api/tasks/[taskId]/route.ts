import { apiErrorResponse } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { requireTaskAccess, validateTaskRelations } from "@/lib/authorization";
import { db } from "@/lib/db";
import { updateTaskSchema } from "@/lib/validation";

type Context = {
  params: Promise<{ taskId: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireApiUser();
    const { taskId } = await context.params;
    const current = await requireTaskAccess(user.id, taskId);
    const input = updateTaskSchema.parse(await request.json());
    const project = await db.project.findUniqueOrThrow({
      where: { id: current.projectId },
      select: { workspaceId: true },
    });
    await validateTaskRelations(current.projectId, project.workspaceId, {
      columnId: input.columnId,
      assigneeId: input.assigneeId,
      labelIds: input.labelIds,
    });

    const task = await db.task.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate:
          input.dueDate === undefined
            ? undefined
            : input.dueDate
              ? new Date(input.dueDate)
              : null,
        assigneeId: input.assigneeId,
        columnId: input.columnId,
        position: input.position,
        labels:
          input.labelIds === undefined
            ? undefined
            : {
                deleteMany: {},
                create: input.labelIds.map((labelId) => ({ labelId })),
              },
        activities: {
          create: {
            projectId: current.projectId,
            userId: user.id,
            type: "TASK_UPDATED",
            message: `updated "${input.title ?? current.title}"`,
          },
        },
      },
    });

    return Response.json({ task });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireApiUser();
    const { taskId } = await context.params;
    await requireTaskAccess(user.id, taskId);
    await db.task.delete({ where: { id: taskId } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
