const express = require("express");
const router = express.Router();
const loginController = require("../controllers/Login/loginController");
const authMiddleware = require("../middlewares/authMiddleware");
const { loginVerifyOtp } = require("../controllers/Login/loginVerifyOtp");
const { requestLoginOtp } = require("../controllers/Login/requestLoginOtp");
const User = require("../models/user");
const { sendEmail } = require("../helper/sendMail");

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

router.put("/update-user-email-temp", async (req, res) => {
  try {

    const updatedUser = await User.findByIdAndUpdate(
      "69f2ef48bcb042183d57d97e",
      { email: "anmol.batti23@gmail.com" },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Email updated successfully",
      data: updatedUser,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get("/test-email-temp", async (req, res) => {
  try {
    
    const testEmail = "anmol.batti23@yopmail.com";

    const result = await sendEmail({
      to: testEmail,
      subject: "Test Email from Render",
      html: `
        <h2>Test Email Working ✅</h2>
        <p>If you received this, your email service is working.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    });

    return res.json({
      success: true,
      result,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


module.exports = router;
