import { AuthError } from "@/lib/auth";
import { formatZodError } from "@/lib/validation";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: 401 });
  }
  if (isValidationError(error)) {
    return Response.json({ error: formatZodError(error) }, { status: 400 });
  }

  console.error(error);
  return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
}

function isValidationError(
  error: unknown,
): error is { issues: Array<{ message: string }> } {
  return (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray(error.issues)
  );
}
