const dbs = require("mongoose");

const availabilitySchema = dbs.Schema({
  startDate: String,
  endDate: String,
  // price: Number,
  //id: Number
});

const roomSchema = dbs.Schema({
  roomType: String,
  inventry: Number,
  child: {
    childWithBedPrice: Number,
    childWithoutBedPrice: Number,
  },
  // occupancy1: Number,
  // occupancy2:Number,
  // occupancy3:Number,

  occupancyRates: [Number],
  amenities: [String],
  duration: [availabilitySchema],
});

const vehicleSchema = dbs.Schema({
  objectType: { type: String, default: "car" },
  vehicleType: String,
  brandName: String,
  modelName: String,
  inventory: Number,
  seatLimit: Number,
  luggageCapacity: Number,
  rate: Number,
  // img: { filename: String, path: String, mimetype: String },
  facilties: String,
  active: Boolean,
  vehicleCategory: String,
  city: String,
  blackout: { start: String, end: String },
});

const categorySchema = dbs.Schema({
  category: {
    type: String,
    enum: ["standard", "deluxe", "super deluxe"],
  },
  name: String,
});

const hotelSchema = dbs.Schema({
  objectType: { type: String, default: "hotel" },
  hotelType: { type: String, required: true },
  hotelName: String,
  rooms: [roomSchema],
  address: String,
  state: String,
  city: String,
  pincode: String,
  phoneNumber: String,
  email: String,
  contactPerson: String,
  descriptions: String,
  contractDate: { start: String, end: String },
  blackout: { start: String, end: String },
  imgs: [{ filename: String, path: String, mimetype: String }],
  active: { type: Boolean, default: false },
});

const vehicleCollection = dbs.model("vehicles", vehicleSchema);
const hotelCollection = dbs.model("hotels", hotelSchema);
const Category = dbs.model("category", categorySchema);

module.exports = { vehicleCollection, hotelCollection, Category };
