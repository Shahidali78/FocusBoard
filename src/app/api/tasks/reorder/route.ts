import { z } from "zod";
import { apiErrorResponse, ApiError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { requireProjectAccess } from "@/lib/authorization";
import { db } from "@/lib/db";

const reorderSchema = z.object({
  projectId: z.string(),
  movedTaskId: z.string(),
  columns: z.array(
    z.object({
      columnId: z.string(),
      taskIds: z.array(z.string()),
    }),
  ),
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const input = reorderSchema.parse(await request.json());
    await requireProjectAccess(user.id, input.projectId);

    const validColumns = await db.boardColumn.findMany({
      where: {
        projectId: input.projectId,
        id: { in: input.columns.map((column) => column.columnId) },
      },
      select: { id: true },
    });
    if (validColumns.length !== input.columns.length) {
      throw new ApiError("One or more board columns are invalid");
    }

    const currentTask = await db.task.findFirst({
      where: { id: input.movedTaskId, projectId: input.projectId },
      include: { column: true },
    });
    if (!currentTask) throw new ApiError("Task not found", 404);

    const target = input.columns.find((column) =>
      column.taskIds.includes(input.movedTaskId),
    );
    if (!target) throw new ApiError("Moved task is missing from the board");

    await db.$transaction([
      ...input.columns.flatMap((column) =>
        column.taskIds.map((taskId, position) =>
          db.task.updateMany({
            where: { id: taskId, projectId: input.projectId },
            data: { columnId: column.columnId, position },
          }),
        ),
      ),
      db.activity.create({
        data: {
          projectId: input.projectId,
          taskId: currentTask.id,
          userId: user.id,
          type: target.columnId === currentTask.columnId ? "TASK_UPDATED" : "TASK_MOVED",
          message:
            target.columnId === currentTask.columnId
              ? `reordered "${currentTask.title}"`
              : `moved "${currentTask.title}"`,
        },
      }),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
