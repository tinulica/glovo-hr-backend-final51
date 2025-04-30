import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attaches { id, email, etc. } to request
    next();
  } catch (error) {
    console.error('JWT Error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
