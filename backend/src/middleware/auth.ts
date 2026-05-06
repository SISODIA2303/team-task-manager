import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import prisma from "../lib/prisma";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Middleware to check if user is admin of a project
export const requireProjectAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projectId = ((req.params.projectId as string) || (req.params.id as string)) as string;
    const userId = req.user?.id;

    if (!userId || !projectId) {
      res.status(400).json({ error: "Missing project or user info" });
      return;
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!membership || membership.role !== "ADMIN") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Authorization check failed" });
  }
};

// Middleware to check if user is a member of a project
export const requireProjectMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projectId = ((req.params.projectId as string) || (req.params.id as string)) as string;
    const userId = req.user?.id;

    if (!userId || !projectId) {
      res.status(400).json({ error: "Missing project or user info" });
      return;
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!membership) {
      res.status(403).json({ error: "Project membership required" });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Authorization check failed" });
  }
};
