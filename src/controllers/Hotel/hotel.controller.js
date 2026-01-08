const { getHotel } = require("./getHotel");
const { addHotel } = require("./addHotel");
const { deleteHotel } = require("./deleteHotel");
const { updateHotel } = require("./updateHotel");
const { getHotelById } = require("./getHotelById");
module.exports = {
  getHotel,
  addHotel,
  deleteHotel,
  getHotelById,
  updateHotel,
};
