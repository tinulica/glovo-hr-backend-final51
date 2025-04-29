// routes/collaborations.js
const express = require('express');
const auth    = require('../middleware/authMiddleware');
const multer  = require('multer');
const { PrismaClient } = require('@prisma/client');
const router  = express.Router();
const prisma  = new PrismaClient();

// Multer setup for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// 1. Start a collaboration
router.post('/:userId', auth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const data = { ...req.body, userId };
    const collab = await prisma.collaboration.create({ data });
    res.status(201).json(collab);
  } catch (err) {
    next(err);
  }
});

// 2. Upload a document to a collaboration
router.post('/:collabId/documents', auth, upload.single('file'), async (req, res, next) => {
  try {
    const { collabId } = req.params;
    const doc = await prisma.document.create({
      data: {
        collaborationId: collabId,
        name:            req.file.originalname,
        url:             `/uploads/${req.file.filename}`,
        category:        req.body.category
      }
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// 3. Get collaboration details (with docs)
router.get('/:collabId', auth, async (req, res, next) => {
  try {
    const collab = await prisma.collaboration.findUnique({
      where: { id: req.params.collabId },
      include: { documents: true }
    });
    res.json(collab);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
