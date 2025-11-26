const dbs = require("mongoose");

const vehicleSchema = dbs.Schema(
  {
    objectType: { type: String, default: "car" },
    vehicleType: String,
    brandName: String,
    modelName: String,
    inventory: Number,
    seatLimit: Number,
    luggageCapacity: Number,
    rate: Number,
    // img: { filename: String, path: String, mimetype: String },
    facilties: {type:[String]},
    active: Boolean,
    vehicleCategory: String,
    city: String,
    blackout: { start: String, end: String },
  },
  {
    timestamps: true,
  }
);

const vehicleCollection = dbs.model("vehicles", vehicleSchema);

module.exports = { vehicleCollection };
