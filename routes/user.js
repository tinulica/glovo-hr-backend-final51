import express from 'express';
import auth from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.put('/display-org-name', auth, async (req, res) => {
  const { displayOrgName } = req.body;

  if (!displayOrgName || displayOrgName.trim() === '') {
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

    res.status(200).json({ message: 'Organization display name saved.' });
  } catch (error) {
    console.error('Error saving display organization name:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;