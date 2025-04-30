// routes/password.js
import express from "express";
import { forgotPassword, resetPassword } from "../controllers/passwordController.js";

const router = express.Router();

// POST /password/forgot
router.post("/forgot", forgotPassword);

// POST /password/reset/:token
router.post("/reset/:token", resetPassword);

export default router;
