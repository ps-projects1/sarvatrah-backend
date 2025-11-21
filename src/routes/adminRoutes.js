const express = require("express");
const adminAuthMiddleware = require("../middlewares/adminMiddleware");
const {
  adminLogin,
  adminRegister,
  adminChangePassword,
} = require("../controllers/admin.controller");

let adminRoutes = express.Router();

adminRoutes.get("/", (req, res) => {
  return res.send({ success: true, message: "Admin route works fine !" });
});

adminRoutes.post("/login", adminLogin);
adminRoutes.post("/register", adminRegister);
adminRoutes.put("/change-password", adminAuthMiddleware, adminChangePassword);

module.exports = adminRoutes;
