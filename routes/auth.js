// src/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashed, fullName },
      select: { id: true, email: true, fullName: true },
    });

    const organization = await prisma.organization.create({
      data: {
        name: `${fullName}'s Organization`,
        ownerId: user.id,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    });

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

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
        organizationId: true,
        displayOrgName: true,
      },
    });

    if (!user) return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        organizationId: user.organizationId,
        displayOrgName: user.displayOrgName,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        organizationId: true,
        displayOrgName: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;