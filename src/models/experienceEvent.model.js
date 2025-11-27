/* const mongoose = require("mongoose"); */

/**
 too save calender events 
 recurring events
 single events
 */

/* const eventSchema = new mongoose.Schema({
  event: mongoose.Schema.Types.Mixed,
}); */

/* module.exports = mongoose.model("EventCalender", eventSchema); */

/**
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  start_time: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TimingAvailability",
  },
  recurring: {
    type: String,
    enum: [
      "weekly",
      "specific_date",
      "between_two_dates",
      "monthly_selected_days",
    ],
    default: "specific_date",
  },
  recurringDetails: {
    daysOfWeek: [
      {
        type: String,
        enum: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
      },
    ],
    startDate: { type: Date },
    endDate: { type: Date },
    selectedMonth: { type: String },
    selectedDays: [{ type: Number }],
    participant: {
      minimum: {
        type: Number,
        default: 1,
      },
      maximum: {
        type: Number,
        default: 15,
      },
    },
  },
 */

const mongoose = require("mongoose");

const eventCalendarSchema = new mongoose.Schema({
  experienceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Experience",
    required: true,
  },

  // recurring, single date, blackout – all share RRULE structure
  rrule: {
    freq: { type: String },            // weekly / daily / monthly
    interval: { type: Number, default: 1 },
    byweekday: [{ type: String }],     // ['mo','tu','we']
    bymonth: [{ type: Number }],       // [1,3,5]
    dtstart: { type: String },         // "2025-02-01T09:00"
    until: { type: String },           // "2025-06-01"
    count: { type: Number },
    byhour: [{ type: Number }],        // 9, 11 etc
  },

  start_time: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimingAvailability",
    },
  ],

  participant: {
    minimum: { type: Number, default: 1 },
    maximum: { type: Number, default: 100 },
  },

  // For event rendering in FullCalendar
  title: { type: String },

  isBlackout: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model("EventCalendar", eventCalendarSchema);
