const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user");
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization").replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const userObject = await User.findById(decoded.id);

    if (!userObject) {
      return res.status(401).json({
        status: false,
        code: 401,
        message: "Unauthorized: Invalid token",
      });
    }

    req.user = userObject;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = authMiddleware;
