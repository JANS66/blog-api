import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../config/db.js";

export const authenticate = async (req, res, next) => {
  // Read token from HTTP-only cookie
  const token = req.cookies?.token;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Authentication required. No token provided." });
  }

  try {
    const decoded = verifyToken(token);

    // Fetch user from DB to verify existence and latest role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      return res
        .status(401)
        .json({ error: "Invalid token. User no longer exists." });
    }

    req.user = user; // Attach user payload to request
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

/**
 * Role based access control middleware generator
 * Usage: authorize('ADMIN', 'AUTHOR')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Forbidden. Insufficient permissions." });
    }
    next();
  };
};
