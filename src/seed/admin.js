// seeders/admin.seeder.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/admin"); // Adjust path if needed

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected...");

    const username = "admin";
    const email = "admin@test.com";
    const password = "Admin@123";

    // Check if admin already exists
    let existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Admin already exists. Seeder skipped.");
      process.exit(0);
    }

    // Create hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin
    await Admin.create({
      username,
      email,
      password: hashedPassword,
    });

    console.log("Admin created successfully!");
    console.log("Login Credentials:");
    console.log("Email:", email);
    console.log("Password:", password);

    process.exit(0);
  } catch (error) {
    console.error("Seeder Error:", error);
    process.exit(1);
  }
};

seedAdmin();
