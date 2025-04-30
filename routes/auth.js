// src/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // 1) Make sure email isn't taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // 2) Hash password & create user
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, fullName }
    });

    // 3) Create their Organization, marking them as owner
    const organization = await prisma.organization.create({
      data: { ownerId: user.id }
    });

    // 4) Update user to point at that org
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id }
    });

    // 5) Sign token with both id & orgId
    const token = jwt.sign(
      { id: updated.id, email: updated.email, orgId: organization.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 6) Return minimal user info + token
    res.status(201).json({
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        orgId: organization.id
      },
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 2) Check password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 3) Ensure they have an org
    if (!user.organizationId) {
      return res.status(400).json({ message: 'Your account has no organization' });
    }

    // 4) Sign token with id & orgId
    const token = jwt.sign(
      { id: user.id, email: user.email, orgId: user.organizationId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        orgId: user.organizationId
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

export default router;
