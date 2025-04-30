// src/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = express.Router();

/**
 * POST /auth/register
 * - Creates a new user
 * - Creates a new Organization owned by that user
 * - Updates the user to belong to that org
 * - Returns { user: { id,email,fullName,organizationId }, token }
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

    // 3) Create the user (no orgId yet)
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

    // 6) Issue JWT (payload.id + payload.email)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
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
    return res.status(500).json({ message: "Registration failed" });
  }
});

/**
 * POST /auth/login
 * - Verifies email/password
 * - Returns { user: { id,email,fullName,organizationId }, token }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, fullName: true, organizationId: true },
    });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 2) Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3) Issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4) Send back the user (minus password) + token
    return res.json({
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
    return res.status(500).json({ message: "Login failed" });
  }
});

export default router;
