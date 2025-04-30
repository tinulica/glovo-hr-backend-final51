// src/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET');

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body;
  try {
    // ensure email free
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'User exists' });

    const hashed = await bcrypt.hash(password, 10);

    // create org + owner in one go
    const orgWithOwner = await prisma.organization.create({
      data: {
        name: fullName || email,
        owner: {
          create: { email, password: hashed, fullName }
        }
      },
      include: { owner: true }
    });

    const user = orgWithOwner.owner;

    // sign token including orgId
    const token = jwt.sign(
      { userId: user.id, orgId: orgWithOwner.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userSafe } = user;
    res.status(201).json({ user: userSafe, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email }, include: { organization: true } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, orgId: user.organizationId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const { password: _, ...userSafe } = user;
    res.json({ user: userSafe, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Login failed' });
  }
});

export default router;
