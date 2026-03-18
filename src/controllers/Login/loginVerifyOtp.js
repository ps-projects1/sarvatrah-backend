const jwt = require("jsonwebtoken");
const User = require("../../models/user");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const loginVerifyOtp = async (req, res) => {
  const { otp: userOtp } = req.body;
  const token = req.cookies.login_otp;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "OTP expired. Please login again.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { userId, otp } = decoded;

    if (String(otp) !== String(userOtp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const user = await User.findById(userId).select("+tokens");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const authToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

    user.tokens.push({
      token: authToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await user.save();

    res.clearCookie("login_otp", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.cookie("auth_token", authToken, {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
});

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token: authToken,
      data: {
        userId: user._id,
        email: user.email,
        mobilenumber: user.mobilenumber,
        userRole: user.userRole,
        firstname: user.firstname,
        lastname: user.lastname,
      },
    });

  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "OTP expired or invalid. Please login again.",
    });
  }
};

module.exports = { loginVerifyOtp };