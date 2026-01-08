const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user");
const Admin = require("../models/admin");

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  // ✅ Token from cookie OR Authorization header
  const token =
    req.cookies.auth_token ||
    req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 401,
      message: "No token, authorization denied",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    let userObject = null;
    let isAdmin = false;
    let userType = "user";

    // ===================== ADMIN CHECK FIRST =====================
    userObject = await Admin.findById(decoded.id);

    if (userObject) {
      isAdmin = true;
      userType = "admin";
    } else {
      // ===================== USER CHECK =====================
      userObject = await User.findById(decoded.id);
      isAdmin = false;
      userType = "user";
    }

    // ===================== INVALID TOKEN =====================
    if (!userObject) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: "Unauthorized: Invalid token",
      });
    }

    // ===================== TOKEN VALIDATION =====================
    const tokenEntry = userObject.tokens?.find(
      (t) => t.token === token
    );

    if (!tokenEntry) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: "Unauthorized: Token not found in database",
      });
    }

    if (tokenEntry.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: "Token expired",
      });
    }

    // ===================== ATTACH TO REQUEST =====================
    req.user = userObject;
    req.isAdmin = isAdmin;
    req.userType = userType;
    req.token = token;

    // ✅ For admin routes compatibility
    if (isAdmin) {
      req.admin = userObject;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: 401,
      message: "Token is not valid",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
