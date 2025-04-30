// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import entriesRoutes from "./routes/entries.js";
import authRoutes from "./routes/auth.js";
import inviteRoutes from "./routes/invite.js";
import passwordRoutes from "./routes/password.js";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads")); // For uploaded files

// Routes
app.use("/entries", entriesRoutes);
app.use("/auth", authRoutes);
app.use("/invite", inviteRoutes);
app.use("/password", passwordRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Glovo HR Backend is running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
