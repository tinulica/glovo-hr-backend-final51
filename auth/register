// src/routes/auth.js
import express from 'express';
import bcrypt  from 'bcryptjs';
import jwt     from 'jsonwebtoken';
import prisma  from '../lib/prisma.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // 1) make sure email is free
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // 2) hash & create the user (no orgId yet)
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, fullName },
    });

    // 3) spin up their Organization, with them as owner
    const org = await prisma.organization.create({
      data: {
        name: `${fullName || email}'s Organization`,
        ownerId: user.id,
      },
    });

    // 4) update the user to belong to that org
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: org.id },
    });

    // 5) issue the JWT
    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user: updatedUser, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

export default router;
