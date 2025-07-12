const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isoCode: { type: String }, // e.g., "GJ", "CA"
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country",
    required: true,
  },
});

module.exports = mongoose.model("State", stateSchema);
