const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    startDate: { type: String },
    endDate: { type: String },
    reason: { type: String }, // maintenance / blackout / custom
  },
  { _id: false }
);

const inventorySchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ["hotel", "package", "activity", "adventure"],
      required: true,
    },

    itemName: { type: String, required: true, trim: true },
    location: { type: String },

    totalUnits: { type: Number, required: true },
    availableUnits: { type: Number, required: true },
    bookedUnits: { type: Number, default: 0 },
    blockedUnits: { type: Number, default: 0 },

    pricePerUnit: { type: Number, required: true },

    status: {
      type: String,
      enum: ["active", "inactive", "sold_out"],
      default: "active",
    },

    availability: [availabilitySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
