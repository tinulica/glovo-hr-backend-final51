// src/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = express.Router();

/**
 * POST /auth/register
 * - Creates a new User
 * - Auto-creates an Organization owned by that User
 * - Tethers the User to their Organization
 * - Returns { user, token }
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // 1) Prevent duplicate emails
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    // 2) Hash password
    const hashed = await bcrypt.hash(password, 10);

    // 3) Create the user (no org yet)
    const user = await prisma.user.create({
      data: { email, password: hashed, fullName },
      select: { id: true, email: true, fullName: true },
    });

    // 4) Create a new organization owned by this user
    const organization = await prisma.organization.create({
      data: {
        name: `${fullName}'s Organization`,
        ownerId: user.id,
      },
    });

    // 5) Tie the user to their new organization
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    });

    // 6) Issue JWT (auth middleware will re-fetch orgId)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        organizationId: organization.id,
      },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/**
 * POST /auth/login
 * - Verifies credentials
 * - Returns { user, token }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Look up user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullName: true, password: true, organizationId: true },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 2) Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3) Issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4) Return user + orgId (omit password)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        organizationId: user.organizationId,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;
