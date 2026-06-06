import { config } from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hash } from "bcryptjs";
import {
  ActivityType,
  PrismaClient,
  TaskPriority,
  WorkspaceRole,
} from "../src/generated/prisma/client";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaNeon({ connectionString });
const db = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hash("Demo1234!", 12);

  const shahid = await db.user.upsert({
    where: { email: "demo@focusboard.dev" },
    update: {},
    create: {
      name: "Shahid Ali",
      email: "demo@focusboard.dev",
      passwordHash,
      avatarColor: "#6D5DFB",
    },
  });

  const maya = await db.user.upsert({
    where: { email: "maya@focusboard.dev" },
    update: {},
    create: {
      name: "Maya Chen",
      email: "maya@focusboard.dev",
      passwordHash,
      avatarColor: "#F97316",
    },
  });

  const noah = await db.user.upsert({
    where: { email: "noah@focusboard.dev" },
    update: {},
    create: {
      name: "Noah Williams",
      email: "noah@focusboard.dev",
      passwordHash,
      avatarColor: "#14B8A6",
    },
  });

  const workspace = await db.workspace.upsert({
    where: { slug: "northstar-studio" },
    update: {},
    create: {
      name: "Northstar Studio",
      slug: "northstar-studio",
      ownerId: shahid.id,
      memberships: {
        create: [
          { userId: shahid.id, role: WorkspaceRole.OWNER },
          { userId: maya.id, role: WorkspaceRole.MEMBER },
          { userId: noah.id, role: WorkspaceRole.MEMBER },
        ],
      },
    },
  });

  const existingProject = await db.project.findUnique({
    where: {
      workspaceId_key: {
        workspaceId: workspace.id,
        key: "WEB",
      },
    },
  });

  if (existingProject) return;

  const project = await db.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Website Refresh",
      key: "WEB",
      description: "Plan, design, and ship the new marketing website.",
      color: "#6D5DFB",
      labels: {
        create: [
          { name: "Design", color: "#8B5CF6" },
          { name: "Frontend", color: "#0EA5E9" },
          { name: "Content", color: "#F97316" },
          { name: "Research", color: "#10B981" },
        ],
      },
      columns: {
        create: [
          { name: "Backlog", position: 0, color: "#94A3B8" },
          { name: "In progress", position: 1, color: "#F59E0B" },
          { name: "In review", position: 2, color: "#8B5CF6" },
          { name: "Done", position: 3, color: "#10B981" },
        ],
      },
    },
    include: {
      columns: true,
      labels: true,
    },
  });

  const columns = Object.fromEntries(project.columns.map((column) => [column.name, column]));
  const labels = Object.fromEntries(project.labels.map((label) => [label.name, label]));

  const taskData = [
    {
      title: "Audit the current marketing pages",
      description: "Review traffic, conversion paths, and outdated content across the current website.",
      priority: TaskPriority.HIGH,
      column: "Backlog",
      assigneeId: maya.id,
      labelNames: ["Research", "Content"],
      dueInDays: 5,
    },
    {
      title: "Build the new navigation shell",
      description: "Create the responsive header, product navigation, and mobile menu.",
      priority: TaskPriority.URGENT,
      column: "In progress",
      assigneeId: shahid.id,
      labelNames: ["Frontend"],
      dueInDays: 2,
    },
    {
      title: "Create homepage visual direction",
      description: "Explore two art directions and prepare the preferred concept for review.",
      priority: TaskPriority.HIGH,
      column: "In progress",
      assigneeId: maya.id,
      labelNames: ["Design"],
      dueInDays: 4,
    },
    {
      title: "Write customer story modules",
      description: "Turn three interviews into concise, outcomes-focused homepage proof points.",
      priority: TaskPriority.MEDIUM,
      column: "In review",
      assigneeId: noah.id,
      labelNames: ["Content"],
      dueInDays: 1,
    },
    {
      title: "Define responsive type scale",
      description: "Document heading, body, and label styles for desktop and mobile breakpoints.",
      priority: TaskPriority.LOW,
      column: "Done",
      assigneeId: maya.id,
      labelNames: ["Design"],
      dueInDays: -2,
    },
    {
      title: "Configure analytics events",
      description: "Track primary CTA clicks, demo form starts, and completed signups.",
      priority: TaskPriority.MEDIUM,
      column: "Backlog",
      assigneeId: shahid.id,
      labelNames: ["Frontend"],
      dueInDays: 8,
    },
  ];

  for (const [position, item] of taskData.entries()) {
    const column = columns[item.column];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + item.dueInDays);

    await db.task.create({
      data: {
        projectId: project.id,
        columnId: column.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        dueDate,
        position,
        assigneeId: item.assigneeId,
        reporterId: shahid.id,
        labels: {
          create: item.labelNames.map((name) => ({
            labelId: labels[name].id,
          })),
        },
      },
    });
  }

  await db.activity.create({
    data: {
      projectId: project.id,
      userId: shahid.id,
      type: ActivityType.PROJECT_CREATED,
      message: "created the Website Refresh project",
    },
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
