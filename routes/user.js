// src/routes/user.js
import express from 'express';
import auth from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// ✅ GET the display organization name
router.get('/display-org-name', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { displayOrgName: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ displayOrgName: user.displayOrgName || '' });
  } catch (error) {
    console.error('Error fetching display organization name:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ✅ PUT to update the display organization name
router.put('/display-org-name', auth, async (req, res) => {
  const { displayOrgName } = req.body;

  if (!displayOrgName) {
    return res.status(400).json({ message: 'Display organization name is required.' });
  }

  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        displayOrgName,
        hasCompletedSetup: true,
      },
    });

    res.status(200).json({ message: 'Organization display name updated successfully.' });
  } catch (error) {
    console.error('Error updating display organization name:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
