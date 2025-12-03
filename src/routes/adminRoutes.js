const express = require("express");
const adminAuthMiddleware = require("../middlewares/adminMiddleware");
const {
  adminLogin,
  adminRegister,
  adminChangePassword,
} = require("../controllers/admin.controller");

const { loginLimiter, generalLimiter } = require("../middlewares/rateLimit");

let  adminRoutes = express.Router();

// Test route (optional, protected with generalLimiter if you want)
adminRoutes.get("/", generalLimiter, (req, res) => {
  return res.send({ success: true, message: "Admin route works fine !" });
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
 