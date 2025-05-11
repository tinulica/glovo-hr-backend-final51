// routes/organizations.js
import express from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      where: {
        id: { not: req.user.orgId }
      },
      select: { id: true, name: true }
    });
    res.json(orgs);
  } catch (err) {
    console.error('Fetch orgs failed:', err);
    res.status(500).json({ message: 'Failed to load organizations' });
  }
});

export default router;
