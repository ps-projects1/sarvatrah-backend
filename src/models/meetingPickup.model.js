const mongoose = require("mongoose");

const meetingPickupSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  address: {
    type: String,
  },
  country: {
    type: String,
  },
  city: {
    type: String,
  },
  pin_code: {
    type: String,
  },
  link: {
    type: String,
  },
  pickup: {
    type: String,
  },
  drop: {
    type: String,
  },
});

module.exports = mongoose.model("MeetingPoint", meetingPickupSchema);
