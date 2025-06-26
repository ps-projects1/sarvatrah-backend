const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../../models/user");
const { generateErrorResponse } = require("../../helper/response");
const { status } = require("express/lib/response");
const { sendOtp, sendCredentials } = require("../../helper/sendMail");
const otpGenerator = require("../../helper/otpGenerator");
const generatePassword = require("../../helper/generatePassword");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

const addUser = async (req, res) => {
  try {
    const { email, userRole } = req.body;

    if (!email || !userRole) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "email and user-role are required",
      });
    }

    const isAdmin = await User.findOne({ email: req.user.email });

    if (isAdmin?.userRole != 3) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Please login as Admin",
      });
    }

    let password = generatePassword();

    // Attempt to send an email with the credentials
    const emailResponse = await sendCredentials(email, email, password);

    if (!emailResponse.responseSuccess) {
      return res.status(500).json(emailResponse?.responseData); // Pass along emailResponse to the client
    }

    // check user exists or not on that role
    const userExists = await User.findOne({ email: email, userRole: userRole });

    if (userExists) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User already exists with this email and user-role",
      });
    }

    const createUser = await User.create({
      userRole: userRole,
      email: email,
      password: password,
    });

    return res.status(200).json({
      message: `${
        userRole == 1 ? "product" : "operation"
      } user add successfully`,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Some internal server error", error.message));
  }
};

module.exports = { addUser };
