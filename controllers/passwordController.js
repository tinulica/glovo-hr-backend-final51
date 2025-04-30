// controllers/passwordController.js
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import sendGmail from "../utils/gmailMailer.js";

const prisma = new PrismaClient();

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return res.json({ message: "If the email exists, a link was sent." });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const resetLink = `${process.env.FRONTEND_URL}/reset/${token}`;

  await sendGmail(email, null, {
    subject: "Reset your password",
    text: `Click to reset: ${resetLink}`,
  });

  res.json({ message: "Password reset link sent." });
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await prisma.user.update({
      where: { id: decoded.id },
      data: { password },
    });
    res.json({ message: "Password updated." });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token." });
  }
};
