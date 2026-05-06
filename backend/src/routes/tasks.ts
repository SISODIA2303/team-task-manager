import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import {
  authenticate,
  requireProjectAdmin,
  requireProjectMember,
} from "../middleware/auth";

const router = Router();
router.use(authenticate);

// List tasks for a project
router.get(
  "/projects/:projectId/tasks",
  requireProjectMember,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;
      const { status, priority, assignedTo, search } = req.query;

      const where: any = { projectId };
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (assignedTo) where.assignedToId = assignedTo;
      if (search)
        where.OR = [
          { title: { contains: search as string } },
          { description: { contains: search as string } },
        ];

      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          createdBy: { select: { id: true, name: true } },
          taskLabels: { include: { label: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: [
          { status: "asc" },
          { priority: "desc" },
          { createdAt: "desc" },
        ],
      });
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Create task (Admin)
router.post(
  "/projects/:projectId/tasks",
  requireProjectAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;
      const { title, description, status, priority, dueDate, assignedToId } =
        req.body;

      if (!title?.trim()) {
        res.status(400).json({ error: "Task title is required" });
        return;
      }

      // Verify assignee is a project member if provided
      if (assignedToId) {
        const isMember = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId: assignedToId } },
        });
        if (!isMember) {
          res.status(400).json({ error: "Assignee must be a project member" });
          return;
        }
      }

      const task = await prisma.task.create({
        data: {
          projectId,
          title: title.trim(),
          description: description?.trim() || null,
          status: status || "TODO",
          priority: priority || "MEDIUM",
          dueDate: dueDate ? new Date(dueDate) : null,
          assignedToId: assignedToId || null,
          createdById: req.user!.id,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          createdBy: { select: { id: true, name: true } },
          taskLabels: { include: { label: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          taskId: task.id,
          userId: req.user!.id,
          action: "CREATED",
          metadata: { title: task.title },
        },
      });

      // Notify assignee
      if (assignedToId && assignedToId !== req.user!.id) {
        await prisma.notification.create({
          data: {
            userId: assignedToId,
            message: `You were assigned task "${task.title}"`,
          },
        });
      }

      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get task detail
router.get(
  "/tasks/:taskId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: req.params.taskId as string },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          createdBy: { select: { id: true, name: true } },
          taskLabels: { include: { label: true } },
          comments: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          attachments: {
            include: { uploadedBy: { select: { id: true, name: true } } },
            orderBy: { uploadedAt: "desc" },
          },
          activityLogs: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });
      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      // Verify user is a project member
      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: task.projectId, userId: req.user!.id },
        },
      });
      if (!membership) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      res.json({ ...task, myRole: membership.role });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Update task
router.put(
  "/tasks/:taskId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: req.params.taskId as string },
      });
      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: task.projectId, userId: req.user!.id },
        },
      });
      if (!membership) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      // Members can only update status of their own tasks
      if (membership.role === "MEMBER") {
        if (task.assignedToId !== req.user!.id) {
          res.status(403).json({ error: "Can only update your own tasks" });
          return;
        }
        const { status } = req.body;
        if (status === "DONE") {
          res.status(403).json({ error: "Only admins can mark tasks as DONE" });
          return;
        }
        const updated = await prisma.task.update({
          where: { id: req.params.taskId as string },
          data: { status },
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
            createdBy: { select: { id: true, name: true } },
            taskLabels: { include: { label: true } },
            _count: { select: { comments: true, attachments: true } },
          },
        });
        await prisma.activityLog.create({
          data: {
            taskId: task.id,
            userId: req.user!.id,
            action: "STATUS_CHANGED",
            metadata: { from: task.status, to: status },
          },
        });
        res.json(updated);
        return;
      }

      // Admin can update everything
      const { title, description, status, priority, dueDate, assignedToId } =
        req.body;
      const updated = await prisma.task.update({
        where: { id: req.params.taskId as string },
        data: {
          ...(title && { title: title.trim() }),
          ...(description !== undefined && {
            description: description?.trim() || null,
          }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(dueDate !== undefined && {
            dueDate: dueDate ? new Date(dueDate) : null,
          }),
          ...(assignedToId !== undefined && {
            assignedToId: assignedToId || null,
          }),
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          createdBy: { select: { id: true, name: true } },
          taskLabels: { include: { label: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      });

      await prisma.activityLog.create({
        data: {
          taskId: task.id,
          userId: req.user!.id,
          action: "UPDATED",
          metadata: req.body,
        },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Update task status (shortcut)
router.patch(
  "/tasks/:taskId/status",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body;
      if (!["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      const task = await prisma.task.findUnique({
        where: { id: req.params.taskId as string },
      });
      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: task.projectId, userId: req.user!.id },
        },
      });
      if (!membership) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      if (membership.role === "MEMBER") {
        if (task.assignedToId !== req.user!.id) {
          res.status(403).json({ error: "Can only update your own tasks" });
          return;
        }
        if (status === "DONE") {
          res.status(403).json({ error: "Only admins can mark tasks as DONE" });
          return;
        }
      }

      const updated = await prisma.task.update({
        where: { id: req.params.taskId as string },
        data: { status },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          createdBy: { select: { id: true, name: true } },
          taskLabels: { include: { label: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      });
      await prisma.activityLog.create({
        data: {
          taskId: task.id,
          userId: req.user!.id,
          action: "STATUS_CHANGED",
          metadata: { from: task.status, to: status },
        },
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Delete task (Admin)
router.delete(
  "/tasks/:taskId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: req.params.taskId as string },
      });
      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: task.projectId, userId: req.user!.id },
        },
      });
      if (!membership || membership.role !== "ADMIN") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      await prisma.task.delete({ where: { id: req.params.taskId as string } });
      res.json({ message: "Task deleted" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Add comment
router.post(
  "/tasks/:taskId/comments",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { content } = req.body;
      if (!content?.trim()) {
        res.status(400).json({ error: "Comment content required" });
        return;
      }

      const task = await prisma.task.findUnique({
        where: { id: req.params.taskId as string },
      });
      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: task.projectId, userId: req.user!.id },
        },
      });
      if (!membership) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const comment = await prisma.comment.create({
        data: {
          taskId: req.params.taskId as string,
          userId: req.user!.id,
          content: content.trim(),
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      await prisma.activityLog.create({
        data: {
          taskId: task.id,
          userId: req.user!.id,
          action: "COMMENT_ADDED",
          metadata: { preview: content.substring(0, 50) },
        },
      });

      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
