const adminOnlyMiddleware = (req, res, next) => {
  try {
    // authMiddleware must run before this
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user found. Please login first.",
      });
    }

    // ✅ Debug info for troubleshooting (remove in production)
    console.log("Admin check:", {
      isAdmin: req.isAdmin,
      userType: req.userType,
      userId: req.user._id,
      userEmail: req.user.email || req.user.username
    });

    // ✅ Reliable admin check (set in authMiddleware)
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admin privileges required",
        debug: {
          userType: req.userType,
          isAdmin: req.isAdmin
        }
      });
    }

    // ✅ Admin verified
    next();

  } catch (error) {
    console.error("Admin authorization error:", error);
    return res.status(500).json({
      success: false,
      message: "Authorization error",
      error: error.message
    });
  }
};

module.exports = adminOnlyMiddleware;
