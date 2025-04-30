// utils/gmailMailer.js
import nodemailer from "nodemailer";
import fs from "fs";

export default async function sendGmail(recipientEmail, filePath) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Glovo HR" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject: "Your Salary History Document",
      text: "Attached is your salary history as requested.",
      attachments: [
        {
          filename: filePath.split("/").pop(),
          path: filePath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // Optionally delete file after sending
    fs.unlinkSync(filePath);

    return true;
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
}
