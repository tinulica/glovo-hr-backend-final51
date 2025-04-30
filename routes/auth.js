// src/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, organizationName } = req.body;

    // 1. Make sure email isn't taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // 2. Hash & create user (orgId stays null for now)
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        fullName,
      }
    });

    // 3. Create an Organization, linking ownerId → user.id
    //    and add this user as a member immediately
    const org = await prisma.organization.create({
      data: {
        name: organizationName || `${fullName}'s Org`,
        ownerId: user.id,
        members: { connect: { id: user.id } }
      }
    });

    // 4. Now update the user to set their organizationId
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: org.id }
    });

    // 5. Sign a token & return
    const token = jwt.sign(
      { id: updatedUser.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        organizationId: updatedUser.organizationId
      },
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // 2. Check password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // 3. Sign & return
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        organizationId: user.organizationId
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed.' });
  }
});

export default router;
