const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
  },
  isOpen: {
    type: Boolean,
    required: true,
  },
  is24Hours: {
    type: Boolean,
    required: function () {
      return this.isOpen;
    },
  },
  openHour: {
    type: String,
    required: function () {
      return !this.is24Hours && this.isOpen;
    },
  },
  closeHour: {
    type: String,
    required: function () {
      return !this.is24Hours && this.isOpen;
    },
  },
});

module.exports = mongoose.model("Availability", availabilitySchema);
