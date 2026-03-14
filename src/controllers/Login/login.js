// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
// const User = require("../../models/user");
// require("dotenv").config();

// const JWT_SECRET = process.env.JWT_SECRET;

// const login = async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({
//       success: false,
//       message: "Email and password are required",
//     });
//   }

//   try {
//     // 🔍 Fetch user + password + tokens
//     const user = await User.findOne({ email })
//       .select("+password +tokens");

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }
   
//     // 🚫 Block unverified users
//     if (!user.isVerified) {
//       return res.status(403).json({
//         success: false,
//         message: "Please verify your email before logging in",
//       });
//     }

//     // 🔐 Compare password
//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }

//     // 🔑 Generate JWT
//     const token = jwt.sign(
//       { id: user._id },
//       JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     // 🧾 Store token (for logout / invalidation)
//     user.tokens.push({
//       token,
//       expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
//     });
//     await user.save();

//     // 🍪 Set auth cookie
//   res.cookie("auth_token", token, {
//   httpOnly: true,                  // prevent JS access
//   secure: true,                     // must be HTTPS
//   sameSite: "none",                 // allow cross-site requests
//   maxAge: 24 * 60 * 60 * 1000,     // 1 day
//   path: "/",                        // accessible across all routes
// });


//     return res.status(200).json({
//       success: true,
//       message: "Logged in successfully",
//       data: {
//         userId: user._id,
//         userRole: user.userRole,
//         firstname: user.firstname,
//         lastname: user.lastname,
//         email: user.email,
//       },
//     });

//   } catch (err) {
//     console.error("Login Error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// module.exports = { login };
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../../models/user");
const otpGenerator = require("../../helper/otpGenerator");
const { sendOtpToPhone } = require("../../helper/sendSmsOtp");

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const user = await User.findOne({ email }).select("+password +tokens");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 🔐 Generate OTP
    const otp = otpGenerator();

    const otpToken = jwt.sign(
      { userId: user._id, mobilenumber: user.mobilenumber, otp },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    // 📱 Send OTP
    const formattedPhone = user.mobilenumber.toString().startsWith('+')
      ? user.mobilenumber.toString()
      : `+91${user.mobilenumber}`;

    const smsResult = await sendOtpToPhone(formattedPhone, otp);

    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP via SMS",
        error: smsResult.error,
      });
    }

    // 🍪 Store OTP token
    res.cookie("login_otp", otpToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 60 * 1000,
      path: "/",
    });

    // ❗ CHANGED RESPONSE
    return res.status(200).json({
      success: true,
      message: "OTP sent to your registered mobile number",
      data: {
        userId: user._id,
        email: user.email,
        mobilenumber: user.mobilenumber,
        userRole: user.userRole,
        firstname: user.firstname,
        lastname: user.lastname,
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { login };