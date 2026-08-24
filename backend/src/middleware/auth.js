import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../config/db.js";

export const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
  } catch (err) {
    // Expired or invalid token falls back safely to guest mode
    req.user = null;
  }

  next();
};

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

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
    next(err); // Forward unexpected errors to global catch all
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

export const verifyActiveUser = async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, role: true, username: true },
  });

  if (!user) {
    return res.status(401).json({ error: "User no longer exists." });
  }

  // Update req.user in case the role or username was changed recently
  req.user = user;
  next();
};
