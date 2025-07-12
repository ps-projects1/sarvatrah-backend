const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  isoCode: { type: String, required: true, unique: true }, // e.g., "IN", "US"
  phoneCode: { type: String }, // Optional: "+91"
});

module.exports = mongoose.model("Country", countrySchema);
