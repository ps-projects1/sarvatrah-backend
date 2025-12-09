const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user");
const Admin = require("../models/admin");

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  // Check token from cookie or authorization header
  const token = req.cookies.auth_token || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: false,
      code: 401,
      message: "No token, authorization denied",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded JWT:", decoded);

    let userObject = null;

    // 1️⃣ Check Admin first
    userObject = await Admin.findOne({ _id: decoded.id });

    // 2️⃣ If admin not found → check User
    if (!userObject) {
      userObject = await User.findOne({ _id: decoded.id });
    }

    // 3️⃣ Still not found → Unauthorized
    if (!userObject) {
      return res.status(401).json({
        status: false,
        code: 401,
        message: "Unauthorized: Invalid token",
      });
    }

    // 4️⃣ Check token entry
    const tokenEntry = userObject.tokens?.find((t) => t.token === token);

    if (!tokenEntry) {
      return res.status(401).json({
        status: false,
        code: 401,
        message: "Unauthorized: Token not found",
      });
    }

    // 5️⃣ Check token expiration
    if (tokenEntry.expiresAt < new Date()) {
      return res.status(401).json({
        status: false,
        code: 401,
        message: "Token expired",
      });
    }

    req.user = userObject;
    req.token = token;

    next();
  } catch (error) {
    return res.status(401).json({
      status: false,
      code: 401,
      message: "Token is not valid",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
