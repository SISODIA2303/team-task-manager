import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// Global dashboard analytics
router.get("/dashboard", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { status: true },
    });

    const activeProjectsCount = projects.filter(
      (p) => p.status === "ACTIVE",
    ).length;
    const completedProjectsCount = projects.filter(
      (p) => p.status === "COMPLETED",
    ).length;

    const tasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: { assignedTo: { select: { id: true, name: true } } },
    });

    const now = new Date();
    const totalTasks = tasks.length;
    const byStatus = {
      TODO: tasks.filter((t) => t.status === "TODO").length,
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      DONE: tasks.filter((t) => t.status === "DONE").length,
    };

    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE",
    );

    const tasksByUser: Record<
      string,
      { name: string; count: number; completed: number }
    > = {};
    tasks.forEach((t) => {
      if (t.assignedTo) {
        if (!tasksByUser[t.assignedTo.id]) {
          tasksByUser[t.assignedTo.id] = {
            name: t.assignedTo.name,
            count: 0,
            completed: 0,
          };
        }
        tasksByUser[t.assignedTo.id].count++;
        if (t.status === "DONE") tasksByUser[t.assignedTo.id].completed++;
      }
    });

    const byPriority = {
      LOW: tasks.filter((t) => t.priority === "LOW").length,
      MEDIUM: tasks.filter((t) => t.priority === "MEDIUM").length,
      HIGH: tasks.filter((t) => t.priority === "HIGH").length,
      CRITICAL: tasks.filter((t) => t.priority === "CRITICAL").length,
    };

    res.json({
      activeProjectsCount,
      completedProjectsCount,
      totalTasks,
      byStatus,
      byPriority,
      overdueCount: overdueTasks.length,
      overdueTasks: overdueTasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        assignedTo: t.assignedTo,
      })),
      tasksByUser: Object.values(tasksByUser),
      completionRate:
        totalTasks > 0 ? Math.round((byStatus.DONE / totalTasks) * 100) : 0,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Project dashboard analytics
router.get(
  "/projects/:projectId/dashboard",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;

      // Verify membership
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user!.id } },
      });
      if (!membership) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const tasks = await prisma.task.findMany({
        where: { projectId },
        include: { assignedTo: { select: { id: true, name: true } } },
      });

      const now = new Date();
      const totalTasks = tasks.length;
      const byStatus = {
        TODO: tasks.filter((t) => t.status === "TODO").length,
        IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        DONE: tasks.filter((t) => t.status === "DONE").length,
      };

      const overdueTasks = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE",
      );

      // Tasks per user
      const tasksByUser: Record<
        string,
        { name: string; count: number; completed: number }
      > = {};
      tasks.forEach((t) => {
        if (t.assignedTo) {
          if (!tasksByUser[t.assignedTo.id]) {
            tasksByUser[t.assignedTo.id] = {
              name: t.assignedTo.name,
              count: 0,
              completed: 0,
            };
          }
          tasksByUser[t.assignedTo.id].count++;
          if (t.status === "DONE") tasksByUser[t.assignedTo.id].completed++;
        }
      });

      // Priority breakdown
      const byPriority = {
        LOW: tasks.filter((t) => t.priority === "LOW").length,
        MEDIUM: tasks.filter((t) => t.priority === "MEDIUM").length,
        HIGH: tasks.filter((t) => t.priority === "HIGH").length,
        CRITICAL: tasks.filter((t) => t.priority === "CRITICAL").length,
      };

      res.json({
        totalTasks,
        byStatus,
        byPriority,
        overdueCount: overdueTasks.length,
        overdueTasks: overdueTasks.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          assignedTo: t.assignedTo,
        })),
        tasksByUser: Object.values(tasksByUser),
        completionRate:
          totalTasks > 0 ? Math.round((byStatus.DONE / totalTasks) * 100) : 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// My tasks across all projects
router.get("/me/tasks", async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assignedToId: req.user!.id },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        taskLabels: { include: { label: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Notifications
router.get(
  "/notifications",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Mark notification as read
router.patch(
  "/notifications/:id/read",
  async (req: Request, res: Response): Promise<void> => {
    try {
      await prisma.notification.update({
        where: { id: req.params.id as string },
        data: { isRead: true },
      });
      res.json({ message: "Marked as read" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Mark all notifications as read
router.patch(
  "/notifications/read-all",
  async (req: Request, res: Response): Promise<void> => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.id, isRead: false },
        data: { isRead: true },
      });
      res.json({ message: "All marked as read" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Search across tasks and projects
router.get("/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string | undefined;
    if (!q?.trim()) {
      res.json({ tasks: [], projects: [] });
      return;
    }

    // Get user's project IDs
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user!.id },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    const [tasks, projects] = await Promise.all([
      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          OR: [{ title: { contains: q } }, { description: { contains: q } }],
        },
        include: {
          project: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        take: 20,
      }),
      prisma.project.findMany({
        where: {
          id: { in: projectIds },
          OR: [{ name: { contains: q } }, { description: { contains: q } }],
        },
        take: 10,
      }),
    ]);

    res.json({ tasks, projects });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Labels for a project
router.get(
  "/projects/:projectId/labels",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const labels = await prisma.label.findMany({
        where: { projectId: req.params.projectId as string },
      });
      res.json(labels);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Create label (Admin)
router.post(
  "/projects/:projectId/labels",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, color } = req.body;
      if (!name?.trim()) {
        res.status(400).json({ error: "Label name required" });
        return;
      }
      const label = await prisma.label.create({
        data: {
          projectId: req.params.projectId as string,
          name: name.trim(),
          color: color || "#6366f1",
        },
      });
      res.status(201).json(label);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
