const Mongoose = require("mongoose");
const bookingSchema = new Mongoose.Schema({
  user: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  holidayPackageId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "TravelPackage",
    required: true,
  },
  vehicleId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
  },
  hotelId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  bookingDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  totalTraveller: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Cancelled"],
    default: "Pending",
  },
});

const Booking = Mongoose.model("Booking", bookingSchema);

module.exports = Booking;
