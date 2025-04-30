// src/routes/salary.js
import express from "express";
const router = express.Router();

// Example route
router.get("/", (req, res) => {
  res.json({ message: "Salary route working!" });
});

export default router;
