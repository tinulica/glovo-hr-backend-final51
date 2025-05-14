import express from 'express';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    console.log('📨 Incoming setupOrganization request...');
    console.log('🧠 User:', req.user);
    console.log('📦 Body:', req.body);

    const { name, bio = '', invites = [] } = req.body;

    if (!name || !req.user?.id) {
      console.warn('⚠️ Missing name or user ID');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        bio,
        ownerId: req.user.id,
        members: {
          connect: { id: req.user.id }
        }
      }
    });

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        organizationId: organization.id,
        hasCompletedSetup: true
      }
    });

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

    console.log('✅ Organization created successfully.');
    return res.status(201).json({ success: true, organizationId: organization.id });
  } catch (err) {
    console.error('❌ Error creating organization:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;