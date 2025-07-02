const {
  generateResponse,
  generateErrorResponse,
} = require("../../helper/response");
const { hotelCollection } = require("../../models/hotel");

const deleteHotel = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res
        .status(400)
        .json(generateErrorResponse("Please provide hotel ID."));
    }

    const hotel = await hotelCollection.findById(_id);

    if (!hotel) {
      return res.status(404).json(generateErrorResponse("Hotel not found."));
    }

    await hotelCollection.findByIdAndDelete(_id);

    return res
      .status(200)
      .json(generateResponse(true, "Hotel removed successfully."));
  } catch (error) {
    console.error("Delete hotel API error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal server error.", error.message));
  }
};

module.exports = {
  deleteHotel,
};
