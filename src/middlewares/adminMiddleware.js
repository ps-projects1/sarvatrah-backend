const jwt = require("jsonwebtoken");
require("dotenv").config();
const Admin = require("../models/admin");
const JWT_SECRET = process.env.JWT_SECRET;

const adminAuthMiddleware = async (req, res, next) => {
  // ✅ Token from cookie OR Authorization header (consistent with main authMiddleware)
  const token =
    req.cookies.auth_token ||
    req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "No token, authorization denied" 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ Check Admin model (not User model)
    const adminObject = await Admin.findById(decoded.id);

    if (!adminObject) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: "Unauthorized: Invalid admin token",
      });
    }

    // ✅ Token validation (consistent with main authMiddleware)
    const tokenEntry = adminObject.tokens?.find(
      (t) => t.token === token
    );

    if (!tokenEntry) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: "Unauthorized: Token not found",
      });
    }

    if (tokenEntry.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: "Token expired",
      });
    }

    // ✅ Set admin properties for consistency
    req.admin = adminObject;
    req.user = adminObject; // For compatibility
    req.isAdmin = true;
    req.userType = "admin";
    req.token = token;
    
    next();
  } catch (err) {
    res.status(401).json({ 
      success: false,
      message: "Token is not valid",
      error: err.message 
    });
  }
};

module.exports = adminAuthMiddleware;
