const mongoose = require("mongoose");

const eventCalendarSchema = new mongoose.Schema({
  experienceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Experience",
    required: true,
  },

  eventType: {
    type: String,
    enum: [
      "availability",
      "blackout",
      "pricing_override",
    ],
    required: true,
  },

  title: String,

  // recurrence settings
  rrule: {
    freq: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
    },

    interval: {
      type: Number,
      default: 1,
    },

    byweekday: [
      {
        type: String,
        enum: ["su", "mo", "tu", "we", "th", "fr", "sa"],
      },
    ],

    bymonth: [Number],

    dtstart: Date,

    until: Date,

    count: Number,
  },

  // SINGLE DATE SUPPORT
  specificDates: [Date],

  // WEEKEND AUTO BLACKOUT
  includeWeekends: {
    type: Boolean,
    default: false,
  },

  // availability settings
  isAvailable: {
    type: Boolean,
    default: true,
  },

  // blackout
  isBlackout: {
    type: Boolean,
    default: false,
  },

  // pricing override
  priceOverride: {
    enabled: {
      type: Boolean,
      default: false,
    },

    amount: Number,

    currency: {
      type: String,
      default: "USD",
    },
  },

  // capacity override
  participant: {
    minimum: {
      type: Number,
      default: 1,
    },

    maximum: {
      type: Number,
      default: 100,
    },
  },

  start_time: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimingAvailability",
    },
  ],

}, {
  timestamps: true,
});

module.exports = mongoose.model(
  "EventCalendar",
  eventCalendarSchema
);