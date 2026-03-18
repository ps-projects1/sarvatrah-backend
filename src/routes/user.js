const express = require("express");
const router = express.Router();
const loginController = require("../controllers/Login/loginController");
const authMiddleware = require("../middlewares/authMiddleware");
const { loginVerifyOtp } = require("../controllers/Login/loginVerifyOtp");
const { requestLoginOtp } = require("../controllers/Login/requestLoginOtp");

router.post("/login", loginController.login.login);
router.post("/register", loginController.register.register);
router.post("/add-user", authMiddleware, loginController.addUser.addUser);
router.post("/forgot-password", loginController.forgotPassword.forgotPassword);
router.post("/verify-otp", loginController.verifyOtp.verifyOtp);
router.put("/change-password", loginController.changePassword.changePassword);
router.put("/logout", authMiddleware, loginController.logout.logout);
router.get("/resend-otp", loginController.resendOtp.resendOtp);
router.post("/login/verify-otp", loginVerifyOtp);
router.post("/login/request-otp", requestLoginOtp);
module.exports = router;
