import express from "express";
import bcrypt  from "bcryptjs";
import jwt     from "jsonwebtoken";
import prisma  from "../lib/prisma.js";

const router = express.Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName, invitationToken } = req.body;

    // 1) Prevent duplicates
    if (await prisma.user.findUnique({ where: { email } })) {
      return res.status(409).json({ message: "User already exists" });
    }

    // 2) Hash
    const hashedPassword = await bcrypt.hash(password, 10);

    let orgId;

    if (invitationToken) {
      // invited user → lookup & validate
      const inv = await prisma.invitation.findUnique({
        where: { token: invitationToken },
      });
      if (!inv) {
        return res.status(400).json({ message: "Invalid invitation token" });
      }
      orgId = inv.organizationId;
    } else {
      // first user → bootstrap a new org
      // create placeholder user to get an ID
      const placeholder = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          organizationId: "", // temporary
        },
        select: { id: true },
      });

      const org = await prisma.organization.create({
        data: {
          name: `${fullName || email}'s Organization`,
          ownerId: placeholder.id,
        },
      });

      // link placeholder → org
      await prisma.user.update({
        where: { id: placeholder.id },
        data: { organizationId: org.id },
      });

      orgId = org.id;
    }

    // 3) Create the real user (or finalize invited)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        organizationId: orgId,
      },
    });

    // 4) Issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Bad credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ user: { id: user.id, email }, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;
