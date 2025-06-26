const jwt = require("jsonwebtoken");
require("dotenv").config();
const Admin = require("../models/admin");
const JWT_SECRET = process.env.JWT_SECRET;

const adminAuthMiddleware = async (req, res, next) => {
  const token = req.header("Authorization").replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const adminObject = await Admin.findById(decoded.id);

    if (!adminObject) {
      return res.status(401).json({
        status: false,
        code: 401,
        message: "Unauthorized: Invalid token",
      });
    }

    req.admin = adminObject;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = adminAuthMiddleware;
