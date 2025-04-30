// routes/invite.js
import express from "express";
const router = express.Router();

router.post("/create", async (req, res) => {
  const { email } = req.body;
  const link = `https://your-frontend.com/register?email=${encodeURIComponent(email)}`;
  res.json({ link });
});

export default router;
