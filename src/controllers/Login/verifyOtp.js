const jwt = require("jsonwebtoken");

const verifyOtp = (req, res) => {
  const { otp: userOtp } = req.body;

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

    // Compare the OTP provided by the user with the one in the token
    if (decoded.otp === userOtp) {
      return res
        .status(200)
        .json({ success: true, message: "OTP verified successfully." });
    } else {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }
  } catch (error) {
    console.log("Verify OTP API : ",error);
    
    return res
      .status(403)
      .json({ success: false, message: "Token verification failed." });
  }
};

module.exports = {
  verifyOtp
}
