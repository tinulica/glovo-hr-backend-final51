// src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment");
}

// POST /auth/register
export async function register(req, res) {
  try {
    const { email, password } = req.body;

    // conflict check
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // hash password
    const hash = await bcrypt.hash(password, 10);

    // create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
      },
    });

    // create organization with temporary name (setup later)
    const organization = await prisma.organization.create({
      data: {
        name: "", // to be filled in setup step
        ownerId: user.id,
      },
    });

    // link user to org
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    });

    // issue token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
}

// POST /auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
}
