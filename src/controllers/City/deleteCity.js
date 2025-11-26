const City = require("../../models/city");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");

const deleteCity = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res
        .status(400)
        .json(generateErrorResponse("Bad Request", "City ID is required"));
    }

    // Check if city exists
    const city = await City.findById(_id);
    if (!city) {
      return res
        .status(404)
        .json(generateErrorResponse("Not Found", "City not found"));
    }

    // Delete city
    await City.deleteOne({ _id });

    return res.status(200).json(
      generateResponse(true, "City deleted successfully", { _id })
    );
  } catch (error) {
    console.log("Delete City API Error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { deleteCity };
