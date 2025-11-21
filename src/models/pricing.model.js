const mongoose = require("mongoose");

/**
 const categories = [
    { label: 'Adult' },
    { label: 'Child' },
    { label: 'Teenager' },
    { label: 'Infant' },
    { label: 'Senior' },
    { label: 'Student' },
    { label: 'Military' },
    { label: 'Group' },
    { label: 'Other' },
];
 */
const pricingSchema = new mongoose.Schema({
  ticket_category: {
    type: String,
    required: true,
    enum: [
      "adult",
      "child",
      "teenager",
      "infant",
      "senior",
      "student",
      "military",
      "group",
      "other",
    ],
    default: "adult",
  },
  occupancy: {
    type: Number || null,
  },
  min_age: {
    type: Number || null,
  },
  max_age: {
    type: Number || null,
  },
  price: {
    type: Number,
    default: 100,
  },
});

module.exports = mongoose.model("Pricing", pricingSchema);
