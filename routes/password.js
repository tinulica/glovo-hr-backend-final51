// src/routes/password.js
import express from 'express';
const router = express.Router();

// Forgot password route
router.post('/forgot', async (req, res) => {
  const { email } = req.body;

  // Add your logic to send email
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  return res.json({ message: 'Password reset link sent to email (mock)' });
});

export default router;
