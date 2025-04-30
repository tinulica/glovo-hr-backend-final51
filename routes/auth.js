import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = express.Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    // 1) check existing
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    // 2) hash + create user
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, fullName },
    });

    // 3) create an Organization for them
    const org = await prisma.organization.create({
      data: {
        name: `${fullName}'s Org`,
        ownerId: user.id,
      },
    });

    // 4) sign a token containing their user.id and org.id
    const token = jwt.sign(
      { id: user.id, email: user.email, orgId: org.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      user: { id: user.id, email: user.email, fullName },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1) find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // 2) check pw
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // 3) fetch their org
    const org = await prisma.organization.findFirst({
      where: { ownerId: user.id },
    });
    // 4) sign token
    const token = jwt.sign(
      { id: user.id, email: user.email, orgId: org.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      user: { id: user.id, email: user.email, fullName: user.fullName },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;
