import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

// ─── Signup ──────────────────────────────────────────────
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    // Hash password & create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.accessTokenExpiry,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwtRefreshSecret,
      {
        expiresIn: config.refreshTokenExpiry,
      } as jwt.SignOptions,
    );

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Login ───────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const accessToken = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.accessTokenExpiry,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwtRefreshSecret,
      {
        expiresIn: config.refreshTokenExpiry,
      } as jwt.SignOptions,
    );

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Refresh Token ───────────────────────────────────────
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const newAccessToken = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.accessTokenExpiry,
    } as jwt.SignOptions);

    res.json({ accessToken: newAccessToken, user });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// ─── Get Current User ────────────────────────────────────
router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
