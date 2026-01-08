const Admin = require("../models/admin");

const adminOnlyMiddleware = async (req, res, next) => {
  try {
    // req.user is already attached by authMiddleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // If user comes from Admin collection → allow
    if (req.user instanceof Admin || req.user.role === "admin") {
      return next();
    }

    // Otherwise → block
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authorization error",
    });
  }
};

module.exports = adminOnlyMiddleware;
