export type BoardUser = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
};

export type BoardLabel = {
  id: string;
  name: string;
  color: string;
};

export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  position: number;
  columnId: string;
  assignee: BoardUser | null;
  reporter: BoardUser;
  labels: BoardLabel[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BoardColumn = {
  id: string;
  name: string;
  color: string;
  position: number;
  tasks: BoardTask[];
};

export type BoardProject = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  color: string;
  workspaceId: string;
  columns: BoardColumn[];
  labels: BoardLabel[];
};

export type ProjectSummary = {
  id: string;
  name: string;
  key: string;
  color: string;
  taskCount: number;
};

export type ActivityItem = {
  id: string;
  message: string;
  type: string;
  createdAt: string;
  user: BoardUser;
  taskTitle: string | null;
};

export type DashboardData = {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  project: BoardProject;
  projects: ProjectSummary[];
  members: BoardUser[];
  activities: ActivityItem[];
};
