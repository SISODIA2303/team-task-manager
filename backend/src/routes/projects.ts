import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import {
  authenticate,
  requireProjectAdmin,
  requireProjectMember,
} from "../middleware/auth";

const router = Router();
router.use(authenticate);

// List user's projects
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user!.id },
      include: {
        project: {
          include: {
            creator: { select: { id: true, name: true, email: true } },
            createdBy: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            _count: { select: { tasks: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
    const projects = memberships.map((m) => ({
      ...m.project,
      myRole: m.role,
      memberCount: m.project.createdBy.length,
      taskCount: m.project._count.tasks,
    }));
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create project
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, dueDate } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: "Project name is required" });
      return;
    }
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: req.user!.id,
        createdBy: { create: { userId: req.user!.id, role: "ADMIN" } },
      },
    });
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        userId: req.user!.id,
        action: "PROJECT_CREATED",
        metadata: { name: project.name },
      },
    });
    res.status(201).json({ ...project, myRole: "ADMIN" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get project detail
router.get(
  "/:id",
  requireProjectMember,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id as string },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          createdBy: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
            orderBy: { joinedAt: "asc" },
          },
          _count: { select: { tasks: true } },
        },
      });
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      const membership = project.createdBy.find(
        (m) => m.userId === req.user!.id,
      );
      res.json({ ...project, myRole: membership?.role || "MEMBER" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Update project (Admin)
router.put(
  "/:id",
  requireProjectAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, status, dueDate } = req.body;
      const project = await prisma.project.update({
        where: { id: req.params.id as string },
        data: {
          ...(name && { name: name.trim() }),
          ...(description !== undefined && {
            description: description?.trim() || null,
          }),
          ...(status && { status }),
          ...(dueDate !== undefined && {
            dueDate: dueDate ? new Date(dueDate) : null,
          }),
        },
      });
      await prisma.activityLog.create({
        data: {
          projectId: project.id,
          userId: req.user!.id,
          action: "PROJECT_UPDATED",
          metadata: req.body,
        },
      });
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Delete project (Admin)
router.delete(
  "/:id",
  requireProjectAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      await prisma.project.delete({ where: { id: req.params.id as string } });
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Add member (Admin)
router.post(
  "/:id/members",
  requireProjectAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, role } = req.body;
      if (!email) {
        res.status(400).json({ error: "Member email is required" });
        return;
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const existing = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: req.params.id as string,
            userId: user.id,
          },
        },
      });
      if (existing) {
        res.status(409).json({ error: "Already a member" });
        return;
      }
      const membership = await prisma.projectMember.create({
        data: {
          projectId: req.params.id as string,
          userId: user.id,
          role: role === "ADMIN" ? "ADMIN" : "MEMBER",
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });
      await prisma.activityLog.create({
        data: {
          projectId: req.params.id as string,
          userId: req.user!.id,
          action: "MEMBER_ADDED",
          metadata: { addedUser: user.name, role },
        },
      });
      res.status(201).json(membership);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Remove member (Admin)
router.delete(
  "/:id/members/:userId",
  requireProjectAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = req.params.id as string;
      const userId = req.params.userId as string;
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (project?.createdById === userId) {
        res.status(400).json({ error: "Cannot remove project creator" });
        return;
      }

      const userToRemove = await prisma.user.findUnique({
        where: { id: userId },
      });

      await prisma.projectMember.delete({
        where: { projectId_userId: { projectId, userId } },
      });
      await prisma.activityLog.create({
        data: {
          projectId: projectId,
          userId: req.user!.id,
          action: "MEMBER_REMOVED",
          metadata: { removedUser: userToRemove?.name || "a user" },
        },
      });
      res.json({ message: "Member removed" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get project activities (Audit Log)
router.get(
  "/:id/activities",
  requireProjectMember,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const activities = await prisma.activityLog.findMany({
        where: {
          OR: [
            { projectId: req.params.id as string },
            { task: { projectId: req.params.id as string } },
          ],
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          task: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
