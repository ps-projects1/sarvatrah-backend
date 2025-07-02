const {
  generateResponse,
  generateErrorResponse,
} = require("../../helper/response");
const { hotelCollection } = require("../../models/hotel");

const getHotel = async (req, res) => {
  try {
    const hotelData = await hotelCollection.find({});

    if (!hotelData) {
      return res.status(404).json({
        status: false,
        message: "No data found...",
      });
    }

    return res
      .status(200)
      .json(generateResponse(true, "Hotel list data...", hotelData));
  } catch (error) {
    console.log("Get hotel API :", error);
    return res
      .status(5000)
      .json(generateErrorResponse("Some internal server error", error.message));
  }
};

module.exports = {
  getHotel,
};
