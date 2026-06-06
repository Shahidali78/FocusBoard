import { apiErrorResponse, ApiError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { requireWorkspaceAccess } from "@/lib/authorization";
import { db } from "@/lib/db";
import { createProjectSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const input = createProjectSchema.parse(await request.json());
    await requireWorkspaceAccess(user.id, input.workspaceId);

    const duplicate = await db.project.findUnique({
      where: {
        workspaceId_key: {
          workspaceId: input.workspaceId,
          key: input.key,
        },
      },
    });
    if (duplicate) throw new ApiError("This project key is already in use", 409);

    const project = await db.project.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        key: input.key,
        description: input.description,
        color: input.color,
        columns: {
          create: [
            { name: "Backlog", position: 0, color: "#94A3B8" },
            { name: "In progress", position: 1, color: "#F59E0B" },
            { name: "In review", position: 2, color: "#8B5CF6" },
            { name: "Done", position: 3, color: "#10B981" },
          ],
        },
        labels: {
          create: [
            { name: "Feature", color: "#6D5DFB" },
            { name: "Bug", color: "#EF4444" },
            { name: "Research", color: "#10B981" },
          ],
        },
        activities: {
          create: {
            userId: user.id,
            type: "PROJECT_CREATED",
            message: `created the ${input.name} project`,
          },
        },
      },
    });

    return Response.json({ project }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
