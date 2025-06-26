require("dotenv").config();
const { generateErrorResponse } = require("../../helper/response");
const User = require("../../models/user");
const bcrypt = require("bcrypt");
const { sendOtp } = require("../../helper/sendMail");
const otpGenerator = require("../../helper/otpGenerator");
const jwt = require("jsonwebtoken");

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "email is required",
      });
    }

    const isExist = await User.findOne({ email });

    if (!isExist) {
      return res.status(422).json({
        status: 422,
        success: false,
        message: "email not exist",
      });
    }

    let otp = otpGenerator();
    let resetToken = jwt.sign({ email, otp }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    let sendMailResponse = await sendOtp(email, otp);

    console.log("sendMailResponse >> ", sendMailResponse);

    if (!sendMailResponse?.success) {
      return res
        .status(500)
        .json({ success: false, message: sendMailResponse?.message });
    } else {
      const options = {
        expire: new Date(Date.now() + 10 * 60 * 1000),
        httpOnly: true,
        secure: true,
      };

      res
        .cookie("resetPassToken", resetToken, options)
        .status(200)
        .json({ message: "otp sent on your email" });
    }
  } catch (error) {
    console.log("Error forgot password API : ", error);
    return res
      .status(500)
      .json(generateErrorResponse("Some internal server error", error.message));
  }
};

module.exports = {
  forgotPassword,
};
