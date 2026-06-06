import { compare } from "bcryptjs";
import { apiErrorResponse, ApiError } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await db.user.findUnique({ where: { email: input.email } });

    if (!user || !(await compare(input.password, user.passwordHash))) {
      throw new ApiError("Invalid email or password", 401);
    }

    await createSession({ userId: user.id, email: user.email });
    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
