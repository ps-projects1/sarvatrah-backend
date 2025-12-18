const jwt = require("jsonwebtoken");
const User = require("../../models/user");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const verifyOtp = async (req, res) => {
  const { otp: userOtp } = req.body;

  // Only handle the registration OTP cookie
  const token = req.cookies.register_otp;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "OTP token not found or expired",
    });
  }

  try {
    // 🔐 Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    const { email, otp } = decoded;

    // 🔢 Compare OTP
    if (String(otp) !== String(userOtp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ✅ Mark user as verified
    await User.updateOne(
      { email },
      {
        isVerified: true,
        verifiedAt: new Date(),
      }
    );

    // Clear the register OTP cookie
    res.clearCookie("register_otp");

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Your account is now active.",
    });
  } catch (error) {
    console.error("Verify Register OTP Error:", error.message);
    return res.status(403).json({
      success: false,
      message: "OTP expired or invalid",
    });
  }
};

module.exports = { verifyOtp };
