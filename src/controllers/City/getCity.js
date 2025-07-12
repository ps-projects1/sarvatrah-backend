const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const City = require("../../models/city");

const getCity = async (req, res) => {
  try {
    const { stateId } = req.query;

    const query = {};
    if (stateId) {
      query.state = stateId;
    }

    const cities = await City.find(query, "-__v -state -country");

    if (!cities || cities.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No cities found" });
    }

    return res
      .status(200)
      .json(generateResponse(true, "Cities retrieved successfully", cities));
  } catch (error) {
    console.log("Get City API Error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { getCity };
