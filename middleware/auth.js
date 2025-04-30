import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export default async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or malformed token" });
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // payload.id must exist
    if (!payload.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // load user to get up-to-date orgId
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, organizationId: true },
    });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // stash on req
    req.user = {
      id: user.id,
      email: user.email,
      orgId: user.organizationId,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
}
