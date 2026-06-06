import { hash } from "bcryptjs";
import { apiErrorResponse, ApiError } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    if (await db.user.findUnique({ where: { email: input.email } })) {
      throw new ApiError("An account with this email already exists", 409);
    }

    const passwordHash = await hash(input.password, 12);
    const slug = `${slugify(input.name)}-${crypto.randomUUID().slice(0, 6)}`;

    const user = await db.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
        },
      });

      await transaction.workspace.create({
        data: {
          name: `${input.name.split(" ")[0]}'s Workspace`,
          slug,
          ownerId: createdUser.id,
          memberships: {
            create: {
              role: "OWNER",
              userId: createdUser.id,
            },
          },
          projects: {
            create: {
              name: "My First Project",
              key: "MFP",
              description: "A clean board ready for your first idea.",
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
                ],
              },
            },
          },
        },
      });

      return createdUser;
    });

    await createSession({ userId: user.id, email: user.email });
    return Response.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
