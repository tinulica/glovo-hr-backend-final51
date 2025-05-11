import express from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/organizations - List all orgs except the current user's own
router.get('/', requireAuth, async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      where: {
        id: { not: req.user.orgId }  // Exclude the current user's org
      },
      select: {
        id: true,
        name: true
      }
    });

    res.json(orgs);
  } catch (error) {
    console.error('Fetch organizations error:', error);
    res.status(500).json({ message: 'Failed to fetch organizations' });
  }
});

export default router;
