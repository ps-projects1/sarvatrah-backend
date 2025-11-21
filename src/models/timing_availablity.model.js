const mongoose = require("mongoose");

const timing_availabilitySchema = new mongoose.Schema({
  start_time: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
    default: "1:00",
  },
  internal_label: {
    type: String,
  },
  external_label: {
    type: String,
  },
  product_code: {
    type: String,
  },
});

module.exports = mongoose.model(
  "TimingAvailability",
  timing_availabilitySchema
);
