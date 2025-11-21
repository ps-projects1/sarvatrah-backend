const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user");
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  // Get token from cookie instead of header
  const token = req.cookies.auth_token || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: false,
      code: 401,
      message: "No token, authorization denied",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userObject = await User.findOne({
      _id: decoded.id,
      "tokens.token": token, // Verify token exists in user's tokens array
    });

    if (!userObject) {
      return res.status(401).json({
        status: false,
        code: 401,
        message: "Unauthorized: Invalid token",
      });
    }

    // Check if token has expired (additional safety check)
    const tokenEntry = userObject.tokens.find((t) => t.token === token);
    if (tokenEntry.expiresAt < new Date()) {
      return res.status(401).json({
        status: false,
        code: 401,
        message: "Token expired",
      });
    }

    req.user = userObject;
    req.token = token; // Attach token to request
    next();
  } catch (error) {
    res.status(401).json({
      message: "Token is not valid",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
