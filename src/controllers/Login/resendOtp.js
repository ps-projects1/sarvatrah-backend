const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const otpGenerator = require("../../helper/otpGenerator");
const { sendOtpToPhone } = require("../../helper/sendSmsOtp");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

const resendOtp = async (req, res) => {
  try {
    // 🔍 Detect which OTP cookie exists
    const registerToken = req.cookies.register_otp;
    const resetToken = req.cookies.resetPassToken;

    let token;
    let cookieName;
    let purpose;

    if (registerToken) {
      token = registerToken;
      cookieName = "register_otp";
      purpose = "register";
    } else if (resetToken) {
      token = resetToken;
      cookieName = "resetPassToken";
      purpose = "reset";
    } else {
      return res.status(401).json({
        success: false,
        message: "OTP session expired. Please start again.",
      });
    }

    // 🔐 Verify existing token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "OTP session expired. Please start again.",
      });
    }

    const { userId, mobilenumber } = decoded;

    // 🔍 Ensure user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // 🚫 Block resend if already verified (register flow)
    if (purpose === "register" && user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account already verified.",
      });
    }

    // 🔑 Generate new OTP
    const newOtp = otpGenerator();
    const newToken = jwt.sign(
      { userId, mobilenumber, otp: newOtp },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    // 📲 Send OTP via SMS (format phone number with country code for Twilio)
    const formattedPhone = mobilenumber.toString().startsWith('+')
      ? mobilenumber.toString()
      : `+91${mobilenumber}`;
    const smsResult = await sendOtpToPhone(formattedPhone, newOtp);
    if (!smsResult.success) {
      console.error("SMS sending failed:", smsResult.error);
      return res.status(500).json({
        success: false,
        message: "Failed to resend OTP via SMS. Please try again later.",
      });
    }

    // 🍪 Reset the same cookie with new token
    res.cookie(cookieName, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully via SMS.",
    });

  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to resend OTP. Please try again later.",
    });
  }
};

module.exports = { resendOtp };
