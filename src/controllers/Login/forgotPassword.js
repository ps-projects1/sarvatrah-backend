require("dotenv").config();
const { generateErrorResponse } = require("../../helper/response");
const User = require("../../models/user");
const { sendOtpToPhone } = require("../../helper/sendSmsOtp");
const otpGenerator = require("../../helper/otpGenerator");
const jwt = require("jsonwebtoken");

const forgotPassword = async (req, res) => {
  try {
    const { mobilenumber } = req.body;

    if (!mobilenumber) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Mobile number is required",
      });
    }

    // 🔍 Check if user exists
    const user = await User.findOne({ mobilenumber });
    if (!user) {
      return res.status(422).json({
        status: 422,
        success: false,
        message: "Mobile number not registered",
      });
    }

    // 🔑 Generate OTP + JWT token
    const otp = otpGenerator();
    const resetToken = jwt.sign(
      { userId: user._id, mobilenumber, otp },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    // 📲 Send OTP via SMS (format phone number with country code for Twilio)
    const formattedPhone = mobilenumber.toString().startsWith('+')
      ? mobilenumber.toString()
      : `+91${mobilenumber}`;
    const smsResult = await sendOtpToPhone(formattedPhone, otp);
    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP via SMS",
        error: smsResult.error,
      });
    }

    // 🍪 Set OTP token in cookie
    res.cookie("resetPassToken", resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your mobile number",
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Some internal server error", error.message));
  }
};

module.exports = { forgotPassword };
