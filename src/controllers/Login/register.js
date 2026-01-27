const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../../models/user");
const otpGenerator = require("../../helper/otpGenerator");
const { sendOtpToPhone } = require("../../helper/sendSmsOtp");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
  const { firstname, lastname, email, mobilenumber, password } = req.body;

  // Validate required fields
  if (!firstname || !lastname || !mobilenumber || !password) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "firstname, lastname, mobilenumber, and password are required",
    });
  }

  try {
    // Check if user already exists by mobile number
    const existingUser = await User.findOne({
  $or: [
    { email: email },         // check by email
    { mobilenumber: mobilenumber } // check by mobile number
  ]
});
    if (existingUser) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Account with this mobile number or email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (unverified)
    const newUser = await User.create({
      firstname,
      lastname,
      email: email || null,       // optional email
      mobilenumber,
      password: hashedPassword,
      userRole: 0,                 // default: normal user
      isVerified: true,            // set to true for testing; change to false in production
    });

    // Generate OTP and JWT token

    //to be comented
     const otp = otpGenerator();
    const otpToken = jwt.sign(
      { userId: newUser._id, mobilenumber, otp },
      JWT_SECRET,
      { expiresIn: "10m" }   // OTP expires in 10 minutes
    );

    // Send OTP via SMS
    const smsResult = await sendOtpToPhone(mobilenumber, otp);
    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP via SMS",
        error: smsResult.error,
      });
    }

    // Set OTP JWT in cookie
    res.cookie("register_otp", otpToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 60 * 1000,   // 10 minutes
      path: "/",
    }); 

    return res.status(201).json({
      status: 201,
      success: true,
      message: "Account created successfully. ",
    });

  } catch (err) {
    console.error("Register Error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { register };
