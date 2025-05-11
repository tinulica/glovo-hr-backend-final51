import express from 'express';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid';

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

// POST /api/organizations/setup - Complete org profile and invite users
router.post('/setup', requireAuth, async (req, res) => {
  try {
    const { name, bio, invites = [] } = req.body;

    // Update the org
    await prisma.organization.update({
      where: { id: req.user.orgId },
      data: {
        name,
        bio,
        hasCompletedSetup: true
      }
    });

    // Create invites
    for (const email of invites) {
      if (!email.trim()) continue;

      // Avoid inviting existing users
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) continue;

      await prisma.invitation.create({
        data: {
          token: uuidv4(),
          invitedEmail: email,
          inviterId: req.user.id,
          organizationId: req.user.orgId
        }
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Org setup error:', err);
    res.status(500).json({ message: 'Organization setup failed' });
  }
});

export default router;
