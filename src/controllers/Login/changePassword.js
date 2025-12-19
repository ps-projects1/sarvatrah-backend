require("dotenv").config();
const User = require("../../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const changePassword = async (req, res) => {
  try {
    const { otp: userOtp, password: newPassword } = req.body;

    if (!userOtp || !newPassword) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Both OTP and new password are required.",
      });
    }

    // Retrieve JWT token from cookies
    const token = req.cookies.resetPassToken;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Token not found or expired." });
    }

    try {
      // Decode and verify JWT
      const decoded = jwt.verify(token, JWT_SECRET);
      const { userId, mobilenumber, otp } = decoded;

      // Compare OTP from token with the one provided by user
      if (String(otp) !== String(userOtp)) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP.",
        });
      }

      // Find user by ID and mobile number
      const user = await User.findOne({ _id: userId, mobilenumber }).select("+password");
      if (!user) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "User not found.",
        });
      }

      // Hash and update the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      // Clear the cookie after successful password change
      res.clearCookie("resetPassToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      return res.status(200).json({
        success: true,
        message: "Password updated successfully.",
      });

    } catch (error) {
      console.error("Error in Change Password API:", error);
      return res
        .status(403)
        .json({ success: false, message: "Token verification failed or expired." });
    }
  } catch (error) {
    console.error("Error in Change Password API:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later.",
    });
  }
};

module.exports = {
  changePassword,
};
