export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status?: "ACTIVE" | "COMPLETED";
  dueDate?: string;
  createdById: string;
  createdAt: string;
  creator: User;
  createdBy: ProjectMember[];
  myRole: "ADMIN" | "MEMBER";
  memberCount?: number;
  taskCount?: number;
  _count?: { tasks: number };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  user: User;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  assignedToId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: User;
  createdBy: User;
  taskLabels: { label: Label }[];
  comments?: Comment[];
  attachments?: Attachment[];
  activityLogs?: ActivityLog[];
  _count?: { comments: number; attachments: number };
  myRole?: "ADMIN" | "MEMBER";
  project?: { id: string; name: string };
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileUrl: string;
  fileName: string;
  uploadedById: string;
  uploadedAt: string;
  uploadedBy: User;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user: User;
}

export interface DashboardData {
  activeProjectsCount?: number;
  completedProjectsCount?: number;
  totalTasks: number;
  byStatus: { TODO: number; IN_PROGRESS: number; DONE: number };
  byPriority: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
  overdueCount: number;
  overdueTasks: { id: string; title: string; dueDate: string; assignedTo?: User }[];
  tasksByUser: { name: string; count: number; completed: number }[];
  completionRate: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
