// src/routes/auth.js
import express from 'express';
const router = express.Router();

// Example login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Replace this with actual user lookup logic
  if (email === 'admin@demo.com' && password === '123456') {
    return res.json({ success: true, token: 'dummy-jwt-token' });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

export default router;
