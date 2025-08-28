const dbs = require("mongoose");

const categorySchema = dbs.Schema({
  category: {
    type: String,
    enum: ["standard", "deluxe", "super deluxe"],
  },
  name: String,
});

const availabilitySchema = dbs.Schema(
  {
    startDate: String,
    endDate: String,
  },
  { _id: false }
);

const roomSchema = dbs.Schema({
  roomType: String,
  inventory: Number,
  child: {
    childWithBedPrice: Number,
    childWithoutBedPrice: Number,
  },
  occupancyRates: [Number],
  amenities: [String],
  duration: [availabilitySchema],
},{ _id: false });

const hotelSchema = dbs.Schema(
  {
    objectType: { type: String, default: "hotel" },
    hotelType: { type: String, required: true },
    hotelName: { type: String, required: true },
    rooms: [roomSchema],
    address: { type: String },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    contactPerson: { type: String },
    descriptions: { type: String },
    contractDate: {
      start: { type: String },
      end: { type: String },
    },
    blackout: {
      start: { type: String },
      end: { type: String },
    },
    imgs: [
      {
        filename: { type: String },
        path: { type: String },
        mimetype: { type: String },
      },
      {_id: false },
    ],
    active: { type: Boolean, default: false },
    defaultSelected: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Category = dbs.model("category", categorySchema);
const hotelCollection = dbs.model("hotels", hotelSchema);

module.exports = { hotelCollection, Category };
