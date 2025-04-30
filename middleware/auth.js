// src/middleware/auth.js
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export default async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or malformed token" });
    }

    const token = header.split(" ")[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (!payload?.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Fetch the user (and their org) in one go
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, organizationId: true },
    });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach both userId and orgId
    req.user = {
      id: user.id,
      orgId: user.organizationId,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
}
