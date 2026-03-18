const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const otpGenerator = require("../../helper/otpGenerator");
const { sendOtpToPhone } = require("../../helper/sendSmsOtp");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const requestLoginOtp = async (req, res) => {
  const { mobilenumber } = req.body;

  if (!mobilenumber) {
    return res.status(400).json({
      success: false,
      message: "Mobile number is required",
    });
  }

  try {
    const user = await User.findOne({ mobilenumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this mobile number",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Account not verified",
      });
    }

    const otp = otpGenerator();

    const otpToken = jwt.sign(
      { userId: user._id, mobilenumber: user.mobilenumber, otp },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    const formattedPhone = mobilenumber.toString().startsWith("+")
      ? mobilenumber.toString()
      : `+91${mobilenumber}`;

    const smsResult = await sendOtpToPhone(formattedPhone, otp);

    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
        error: smsResult.error,
      });
    }

    res.cookie("login_otp", otpToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to +91 " + mobilenumber,
      data: {
        userId: user._id,
        mobilenumber: user.mobilenumber,
      },
    });

  } catch (err) {
    console.error("Request Login OTP Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { requestLoginOtp };