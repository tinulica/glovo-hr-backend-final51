const express = require('express');
const auth = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Add entry
router.post('/add', auth, upload.single('file'), async (req, res) => {
  const { fullName, salary } = req.body;
  const entry = await prisma.entry.create({
    data: {
      fullName,
      salary: parseFloat(salary),
      adminId: req.user.role === 'admin' ? req.user.id : req.user.ownerId,
      createdBy: req.user.id
    }
  });
  res.status(201).json(entry);
});

// List entries for this admin
router.get('/list', auth, async (req, res) => {
  const adminId = req.user.role === 'admin' ? req.user.id : req.user.ownerId;
  const entries = await prisma.entry.findMany({
    where: { adminId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(entries);
});

module.exports = router;
