const mongoose = require("mongoose");
const {
  generateResponse,
  generateErrorResponse,
} = require("../../helper/response");
const { hotelCollection } = require("../../models/hotel");

/**
 * GET /api/hotel/:id
 * Get single hotel
 */
const getHotelById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔍 Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json(generateErrorResponse("Invalid hotel ID"));
    }

    const hotel = await hotelCollection.findById(id);

    if (!hotel) {
      return res
        .status(404)
        .json(generateErrorResponse("Hotel not found"));
    }

    return res.status(200).json(
      generateResponse(true, "Hotel details fetched successfully", {
        hotel,
      })
    );
  } catch (error) {
    console.log("Get single hotel API :", error);
    return res
      .status(500)
      .json(generateErrorResponse("Some internal server error", error.message));
  }
};

module.exports = { getHotelById };
