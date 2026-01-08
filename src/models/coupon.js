const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    name: { type: String, required: true },
    description: { type: String },

    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },

    discountValue: { type: Number, required: true },
    maxDiscount: { type: Number, default: 0 },
    minOrderValue: { type: Number, default: 0 },

    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },

    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },

    applicableOn: [
      {
        type: String,
        enum: ["hotel", "package", "activity", "adventure"],
      },
    ],

    status: {
      type: String,
      enum: ["active", "inactive", "expired", "scheduled"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
