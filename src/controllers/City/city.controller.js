const { getCity } = require("./getCity");
const { addCity } = require("./addCity");
const { updateCity } = require("./updateCity");
const { deleteCity } = require("./deleteCity");   // ⬅ ADD THIS

module.exports = {
  getCity,
  addCity,
  updateCity,
  deleteCity,                                      // ⬅ EXPORT THIS
};
