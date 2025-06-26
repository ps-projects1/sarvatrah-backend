const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../../models/user");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
  const { firstname, lastname, email, mobilenumber, password } = req.body;
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "firstname,lastname,email and password are required",
    });
  }

  try {
    let userObj = await User.findOne({ email });

    if (userObj) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Account already exist",
      });
    }
    const salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);

    userObj = await User.create({
      firstname,
      lastname,
      email,
      mobilenumber,
      userRole: 0,
      password: hashedPassword,
    });
    return res
      .status(201)
      .json({
        status: 201,
        success: true,
        message: "Accout created successfully",
      });
  } catch (err) {
    return res.send({ success: false, message: err.message });
  }
};

module.exports = { register };
