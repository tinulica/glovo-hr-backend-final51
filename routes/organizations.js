import express from 'express';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js'; // make sure you have JWT middleware

const router = express.Router();

// POST /api/organizations
// Create an organization and assign it to the logged-in user
router.post('/', auth, async (req, res) => {
  try {
    const { name, bio = '', invites = [] } = req.body;

    if (!name || !req.user?.id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name,
        bio,
        ownerId: req.user.id
      }
    });

    // Update user to belong to this organization
    await prisma.user.update({
      where: { id: req.user.id },
      data: { organizationId: organization.id }
    });

    // Optionally: invite emails (if you want to handle them)
    // For now we just log them — you can extend this with actual invite creation
    console.log('Inviting:', invites);

    return res.json({ success: true, organizationId: organization.id });
  } catch (err) {
    console.error('Error creating organization:', err);
    return res.status(500).json({ message: 'Failed to create organization' });
  }
});

export default router;
