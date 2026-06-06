import * as z from "zod/v4-mini";

const trimmedString = (minimum: number, maximum: number, message?: string) =>
  z.string().check(
    z.trim(),
    z.minLength(minimum, message),
    z.maxLength(maximum),
  );

export const registerSchema = z.object({
  name: trimmedString(2, 80, "Name must contain at least 2 characters"),
  email: z.pipe(
    z.string().check(z.trim(), z.toLowerCase()),
    z.email("Enter a valid email address"),
  ),
  password: z.string().check(
    z.minLength(8, "Password must contain at least 8 characters"),
    z.maxLength(72),
    z.regex(/[A-Za-z]/, "Password must contain a letter"),
    z.regex(/[0-9]/, "Password must contain a number"),
  ),
});

export const loginSchema = z.object({
  email: z.pipe(
    z.string().check(z.trim(), z.toLowerCase()),
    z.email("Enter a valid email address"),
  ),
  password: z.string().check(z.minLength(1, "Password is required")),
});

export const createTaskSchema = z.object({
  projectId: z.string().check(z.minLength(1)),
  columnId: z.string().check(z.minLength(1)),
  title: trimmedString(2, 160, "Title must contain at least 2 characters"),
  description: z.optional(z.nullable(trimmedString(0, 2000))),
  priority: z._default(z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]), "MEDIUM"),
  dueDate: z.optional(z.nullable(z.iso.datetime())),
  assigneeId: z.optional(z.nullable(z.string())),
  labelIds: z._default(
    z.array(z.string()).check(z.maxLength(5)),
    [],
  ),
});

export const updateTaskSchema = z.object({
  title: z.optional(trimmedString(2, 160)),
  description: z.optional(z.nullable(trimmedString(0, 2000))),
  priority: z.optional(z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"])),
  dueDate: z.optional(z.nullable(z.iso.datetime())),
  assigneeId: z.optional(z.nullable(z.string())),
  columnId: z.optional(z.string()),
  position: z.optional(z.number().check(z.int(), z.minimum(0))),
  labelIds: z.optional(z.array(z.string()).check(z.maxLength(5))),
});

export const createProjectSchema = z.object({
  workspaceId: z.string().check(z.minLength(1)),
  name: trimmedString(2, 100),
  key: z.string().check(
    z.trim(),
    z.minLength(2),
    z.maxLength(8),
    z.regex(/^[A-Za-z0-9]+$/),
    z.toUpperCase(),
  ),
  description: z.optional(z.nullable(trimmedString(0, 500))),
  color: z._default(
    z.string().check(z.regex(/^#[0-9A-Fa-f]{6}$/)),
    "#6D5DFB",
  ),
});

export function formatZodError(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? "The request contains invalid data";
}
