const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Admin = require("../models/admin");
const User = require("../models/user");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

// --------------------- Admin login ---------------------
const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  // password
  // test@123

  try {
    const admin = await User.findOne({ email: email });

    if (!admin) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = await jwt.sign({ id: admin._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    const tokens = [
      { token: token, expiresAt: new Date(Date.now() + 3600000) },
    ];

    admin.tokens = tokens;

    // await Admin.updateOne(
    //   { email },
    //   { $set: { tokens, password: hashedPassword } }
    // );
    await admin.save();

    res.json({
      success: true,
      message: "Admin Logged in successfully !",
      data: {
        token,
        name: admin.firstname,
        email: admin.email,
        userrole: admin.userRole,
      },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------- Admin Register ---------------------
const adminRegister = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.send({
      success: false,
      message: "username and password are required",
    });
  }

  try {
    let adminObj = await Admin.findOne({ username });

    if (adminObj) {
      return res.send({ success: false, message: "Account already exist" });
    }
    const salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);

    adminObj = await Admin.create({ username, password: hashedPassword });
    return res.send({ success: true, message: "Accout created successfully" });
  } catch (err) {
    return res.send({ success: false, message: err.message });
  }
};

// --------------------- Admin Change Password ---------------------
const adminChangePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const { id } = req.admin;

  try {
    // find the admin
    const adminObject = await Admin.findById(id);
    console.log(adminObject);

    if (!adminObject) {
      return res
        .status(400)
        .json({ message: "Admin not found please login first" });
    }

    const comparePassword = await bcrypt.compare(
      oldPassword,
      adminObject.password
    );

    if (!comparePassword) {
      return res.status(400).json({ message: "Old password is wrong" });
    }

    // check new and confirm Password same or not
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "new and confirm password not matched..." });
    }

    let hashedPassword = bcrypt.hashSync(newPassword, 10);

    // update the password
    adminObject.password = hashedPassword;
    await adminObject.save();

    res.status(200).json({
      success: true,
      message: "Admin password changed successfully !",
    });
  } catch (error) {
    console.error("Error during change password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { adminLogin, adminRegister, adminChangePassword };
