const Mongoose = require("mongoose");

const travellerSchema = new Mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  contactNumber: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  isLeadTraveller: { type: Boolean, default: false },
  pickupLocation: { type: String, trim: true },
  dropLocation: { type: String, trim: true },
});

const hotelDetailsSchema = new Mongoose.Schema({
  hotelId: { type: Mongoose.Schema.Types.ObjectId, ref: "Hotel" },
  roomType: { type: String },
  occupancy: { type: Number }, // 1, 2, 3
  childWithBed: { type: Boolean, default: false },
  childWithoutBed: { type: Boolean, default: false },
  childWithBedPrice: { type: Number, default: 0 },
  childWithoutBedPrice: { type: Number, default: 0 },
  perDayRoomPrice: { type: Number, default: 0 }, // occupancy + child price
  totalHotelCost: { type: Number, default: 0 },
});


const billingSchema = new Mongoose.Schema({
  title: { type: String, trim: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, trim: true },
  pincode: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  contactNumber: { type: String, trim: true },
  gstNumber: { type: String, trim: true },
});

const costBreakupSchema = new Mongoose.Schema({
  days: Number,
  hotelCost: Number,
  vehicleCost: Number,
  priceMarkup: Number,
  hotelPriceFound: Boolean,
  vehiclePriceFound: Boolean,
  finalPackage: Number,
}, { _id: false });

const bookingSchema = new Mongoose.Schema(
  {
    user: { type: Mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    bookingDate: { type: Date, default: Date.now, required: true },
    totalTraveller: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
    },
    travellers: [travellerSchema],
    billingInfo: billingSchema,
    costBreakup: costBreakupSchema,
    hotelDetails: hotelDetailsSchema,

  },
  { timestamps: true }
);

// Ensure only one lead traveller
bookingSchema.pre("save", function (next) {
  const leadCount = this.travellers.filter((t) => t.isLeadTraveller).length;
  if (leadCount !== 1) {
    return next(
      new Error("There must be exactly one lead traveller per booking.")
    );
  }
  next();
});

const Booking = Mongoose.model("Booking", bookingSchema);
module.exports = Booking;
