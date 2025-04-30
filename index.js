import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import inviteRoutes from "./routes/invite.js";
import entryRoutes from "./routes/entries.js";
import reportRoutes from "./routes/report.js";
import salaryRoutes from "./routes/salary.js";
import userRoutes from "./routes/users.js";
import importRoutes from "./routes/import.js";

dotenv.config();

const app = express();

// Allow your Vercel frontend + localhost
const allowedOrigins = [
  "https://sadsadas22222.vercel.app", // your Vercel domain
  "http://localhost:3000"             // for local development
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/invite", inviteRoutes);
app.use("/entries", entryRoutes);
app.use("/report", reportRoutes);
app.use("/salary", salaryRoutes);
app.use("/users", userRoutes);
app.use("/import", importRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
