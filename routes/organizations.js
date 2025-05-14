import express from 'express';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/organizations
 * - Creates a new organization with `name`, optional `bio`
 * - Sets current user as owner
 * - Updates the user's organizationId
 * - Returns { success: true, organizationId }
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, bio = '', invites = [] } = req.body;

    if (!name || !req.user?.id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create the new organization
    const organization = await prisma.organization.create({
      data: {
        name,
        bio,
        ownerId: req.user.id,
        members: {
          connect: { id: req.user.id } // add creator to members
        }
      }
    });

    // Update the user to point to this new org
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        organizationId: organization.id,
        hasCompletedSetup: true
      }
    });

    // Optional: store invite emails (not full logic, but placeholder)
    if (invites.length) {
      for (const email of invites.filter(e => e.trim())) {
        await prisma.invitation.create({
          data: {
            token: crypto.randomUUID(),
            invitedEmail: email,
            inviterId: req.user.id,
            organizationId: organization.id
          }
        });
      }
    }

    return res.status(201).json({ success: true, organizationId: organization.id });
  } catch (err) {
    console.error('🚨 Error in POST /api/organizations:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
