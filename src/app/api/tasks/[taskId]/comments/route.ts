import { z } from "zod";
import { apiErrorResponse } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { requireTaskAccess } from "@/lib/authorization";
import { db } from "@/lib/db";

const commentSchema = z.object({
  body: z.string().trim().min(1).max(1000),
});

type Context = {
  params: Promise<{ taskId: string }>;
};

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireApiUser();
    const { taskId } = await context.params;
    await requireTaskAccess(user.id, taskId);

    const comments = await db.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
          },
        },
      },
    });
    return Response.json({
      comments: comments.map((comment) => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireApiUser();
    const { taskId } = await context.params;
    const task = await requireTaskAccess(user.id, taskId);
    const input = commentSchema.parse(await request.json());

    const comment = await db.comment.create({
      data: {
        taskId,
        authorId: user.id,
        body: input.body,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
          },
        },
      },
    });

    await db.activity.create({
      data: {
        projectId: task.projectId,
        taskId,
        userId: user.id,
        type: "COMMENT_ADDED",
        message: `commented on "${task.title}"`,
      },
    });

    return Response.json(
      {
        comment: {
          ...comment,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
