const mongoose = require("mongoose");
const availabilityModel = require("./availability.model");
const pricingModel = require("./pricing.model");
const meetingPickupMode = require("./meetingPickup.model");

const bookingCutoffMap = {
  rightUpUntilStart: "I take booking right up until the start of the activity",
  min15Before: "15 minutes before start time",
  min30Before: "30 minutes before start time",
  hour1Before: "1 hour before start time",
  hour2Before: "2 hours before start time",
  hour3Before: "3 hours before start time",
  hour4Before: "4 hours before start time",
  hour8Before: "8 hours before start time",
  day1Before: "1 day before start time",
  day2Before: "2 days before start time",
  day3Before: "3 days before start time",
  day4Before: "4 days before start time",
  day5Before: "5 days before start time",
  day6Before: "6 days before start time",
  week1Before: "1 week before start time",
  week2Before: "2 weeks before start time",
  week4Before: "4 weeks before start time",
  week8Before: "8 weeks before start time",
  custom: "I want to define my own booking cutoff",
};

const expirenceSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  duration: String,
  location: {
    location: String,
    city: String,
    state: String,
    country: String,
  },
  category_theme: {
    category: [{ type: String }],
    theme: [{ type: String }],
  },
  description: {
    short_des: String,
    detail_dec: String,
  },
  video_link: [String],
  img_link: {
    filename: String,
    path: String,
    mimetype: {
      type: String,
      default: "image/png",
    },
  },
  inclusions: {
    short_des: String,
    detail_dec: String,
  },
  exclusions: {
    short_des: String,
    detail_dec: String,
  },
  availabilityType: {
    type: String,
    enum: ["date_time", "date", "pass"],
  },
  predefinedTimeAllowances: {
    type: String,
    enum: Object.keys(bookingCutoffMap),
    default: "rightUpUntilStart",
  },
  availability_detail: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Availability",
    },
  ],
  start_time: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimingAvailability",
    },
  ],
  allow_custom_availability: {
    type: Boolean,
    default: false,
  },
  customTimeAllowance: {
    typeOf: {
      type: String,
      enum: ["date", "date_time"],
    },
    value: {
      type: String,
    },
  },
  capacity: {
    type: String,
    enum: ["sale", "limited", "on_request"],
    default: "sale",
  },
  pricing: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pricing",
    },
  ],
  travelling_facility: {
    pick_up_and_drop: {
      price: {
        type: Number,
      },
    },
    pick_up_only: {
      price: {
        type: Number,
      },
    },
    drop_only: {
      price: {
        type: Number,
      },
    },
  },
  traveller_facilty: {
    type: String,
    enum: ["meet_on_location", "pick_up_only", "meet_on_location_or_pickup"],
  },
  meeting_point: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeetingPoint",
    },
  ],
  calender_events: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventCalender",
    },
  ],
  groupSize: {
    type: Number,
    default: 2,
  },
  cancelation_policy: {
    type: String,
    enum: ["free", "paid", "learn more"],
    default: "learn more",
  },
});

const Experience = mongoose.model("Experience", expirenceSchema);
module.exports = Experience;
