const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../../models/user");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

// --------------------- Login ---------------------
const login = async (req, res) => {
  const { email, password } = req.body;
  // password
  // test@123
  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = await jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    const tokens = [
      { token: token, expiresAt: new Date(Date.now() + 3600000) },
    ];

    user.tokens = tokens;

    // await Admin.updateOne(
    //   { email },
    //   { $set: { tokens, password: hashedPassword } }
    // );
    await user.save();

    res.json({
      success: true,
      message: "Logged in successfully !",
      data: { token: token, userRole: user.userRole, userId: user._id },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { login };
