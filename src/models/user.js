const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    firstname: {
      type: String,
      trim: true,
    },

    lastname: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
   
      unique: true,       // 🔐 prevent duplicate accounts
      lowercase: true,
      trim: true,
    },

    mobilenumber: {
      type: Number,
    },

    profilePicture: {
      type: String,
      default: null,
    },

    password: {
      type: String,
  
      select: false,      // 🔐 hide password by default
    },

    // User roles: 0 = User, 1 = Product Manager, 2 = Booking Operator, 3 = Super Admin
    userRole: {
      type: Number,
      enum: [0, 1, 2, 3],
      default: 0,
      required: true,
    },

    // ✅ Email verification status
    isVerified: {
      type: Boolean,
      default: false,
    },

    // ✅ Optional: when OTP/email was verified
    verifiedAt: {
      type: Date,
    },
    otplessSub: {
  type: String,
  index: true,
},
authProvider: {
  type: String,
  enum: ['password', 'otpless'],
  default: 'password',
},


    // 🔐 Login / session tokens (optional but useful)
    tokens: [
      {
        token: { type: String },
        expiresAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
