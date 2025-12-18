const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../../models/user");
const otpGenerator = require("../../helper/otpGenerator");
const { sendOtp } = require("../../helper/sendMail");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
  const { firstname, lastname, email, mobilenumber, password } = req.body;
  
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "firstname, lastname, email and password are required",
    });
  }

  try {
    // 🔍 Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Account already exists",
      });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 👤 Create user (unverified)
    await User.create({
      firstname,
      lastname,
      email,
      mobilenumber,
      userRole: 0,
      password: hashedPassword,
      isVerified: false,
    });

    // 🔑 Generate OTP + JWT
    const otp = otpGenerator();
    const otpToken = jwt.sign(
      { email, otp },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    // 📧 Send OTP email
    await sendOtp(email, otp);

    // 🍪 Set OTP cookie
 res.cookie("register_otp", otpToken, {
  httpOnly: true,                // prevent JS access
  secure: true,                  // must be HTTPS
  sameSite: "none",              // allow cross-site requests
  maxAge: 10 * 60 * 1000,        // 10 minutes
  path: "/",                     // accessible across all routes
});

    return res.status(201).json({
      status: 201,
      success: true,
      message: "Account created successfully. OTP sent to email.",
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




