import express from 'express';
const router = express.Router();

// Example report route
router.get('/', (req, res) => {
  res.send('Report route working!');
});

export default router;
