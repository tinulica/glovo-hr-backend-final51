// routes/entries.js
const express = require('express');
const auth    = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const router  = express.Router();
const prisma = new PrismaClient();

// List entries
router.get('/list', auth, async (req, res) => {
  const adminId = req.user.role === 'admin' ? req.user.id : req.user.ownerId;
  const entries = await prisma.entry.findMany({
    where: { adminId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(entries);
});

// Add entry
router.post('/add', auth, async (req, res) => {
  const { platform, fullName, email } = req.body;
  const entry = await prisma.entry.create({
    data: {
      platform,
      fullName,
      email,
      adminId: req.user.role === 'admin' ? req.user.id : req.user.ownerId,
      createdBy: req.user.id
    }
  });
  res.status(201).json(entry);
});

// Update entry
router.put('/update/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { platform, fullName, email } = req.body;
  const entry = await prisma.entry.update({
    where: { id },
    data: { platform, fullName, email }
  });
  res.json(entry);
});

module.exports = router;
