require("dotenv").config();
const User = require("../../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const changePassword = async (req, res) => {
  try {
    console.log("change password");

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Password is required.",
      });
    }

    // Retrieve the JWT token from cookies
    const token = req.cookies.resetPassToken;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Token not found." });
    }

    try {
      // Decode and verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user exists with the email from decoded token
      const user = await User.findOne({ email: decoded.email });
      if (!user) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "User not found.",
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update the user's password
      user.password = hashedPassword;
      await user.save();

      res.clearCookie("resetPassToken", { httpOnly: true, secure: true });

      return res.status(200).json({
        success: true,
        message: "Password updated successfully.",
      });
    } catch (error) {
      console.error("Error in Change Password API:", error);
      return res
        .status(403)
        .json({ success: false, message: "Token verification failed." });
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
