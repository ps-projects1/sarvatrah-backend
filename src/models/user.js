const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    firstname: { type: String },
    lastname: { type: String },
    email: { type: String, required: true },
    mobilenumber: { type: Number },
    password: { type: String, required: true },

    // User roles: 0 = User, 1 = Product Manager, 2 = Booking Operator, 3 = Super Admin
    userRole: {
      type: Number,
      enum: [0, 1, 2, 3], // 0: User, 1: Product Manager, 2: Booking Operator, 3: Super Admin
      required: true,
      default: 0, // Default to "User" if no role is specified
    },

    tokens: [
      {
        token: { type: String },
        expiresAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

// Export the model
const User = mongoose.model("User", userSchema);
module.exports = User;
