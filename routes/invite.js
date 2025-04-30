// routes/auth/invite.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { authenticateJWT } from '../../middleware/authenticate';

const router = express.Router();

router.post('/invite', authenticateJWT, async (req, res) => {
  const { email, password } = req.body;
  const { organizationId, role } = req.user;

  if (role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can invite users' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const invitedUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'USER',
        organizationId,
      },
    });

    res.status(201).json({ message: 'User invited successfully', userId: invitedUser.id });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ error: 'User invitation failed' });
  }
});

export default router;
