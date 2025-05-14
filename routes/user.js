// src/routes/user.js
import express from 'express';
import auth from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Set Display Org Name
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
      },
    });
    res.status(200).json({ message: 'Organization display name updated.' });
  } catch (error) {
    console.error('Error updating display organization name:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;