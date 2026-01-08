const express = require("express");
const adminAuthMiddleware = require("../middlewares/adminMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const adminOnlyMiddleware = require("../middlewares/adminOnlyMiddleware");
const {
  adminLogin,
  adminRegister,
  adminChangePassword,
} = require("../controllers/admin.controller");

const { loginLimiter, generalLimiter } = require("../middlewares/rateLimit");

let adminRoutes = express.Router();

// Test route (optional, protected with generalLimiter if you want)
adminRoutes.get("/", generalLimiter, (req, res) => {
  return res.send({ success: true, message: "Admin route works fine !" });
});

// ✅ Admin authentication test route
adminRoutes.get("/test-auth", authMiddleware, adminOnlyMiddleware, (req, res) => {
  return res.json({
    success: true,
    message: "Admin authentication working!",
    data: {
      isAdmin: req.isAdmin,
      userType: req.userType,
      adminId: req.user._id,
      adminEmail: req.user.email || req.user.username
    }
  });
});

// Admin login → apply stricter loginLimiter
adminRoutes.post("/login", loginLimiter, adminLogin);

// Admin registration → optional general limiter
adminRoutes.post("/register", generalLimiter, adminRegister);

// Change password → protect route with auth + optional generalLimiter
adminRoutes.put(
  "/change-password",
  adminAuthMiddleware,
  generalLimiter,
  adminChangePassword
);

module.exports = adminRoutes;
 