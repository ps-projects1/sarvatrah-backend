const City = require("../../models/city");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");

const updateCity = async (req, res) => {
  try {
    const { _id, name, stateId, countryId = "686f500f55aed15b4d9f0697" } = req.body;

    // Validation
    if (!_id) {
      return res
        .status(400)
        .json(generateErrorResponse("Bad Request", "City ID is required"));
    }

    if (!name || !stateId) {
      return res
        .status(400)
        .json(
          generateErrorResponse("Bad Request", "Name and State ID are required")
        );
    }

    // Check if city exists
    const existingCity = await City.findById(_id);
    if (!existingCity) {
      return res
        .status(404)
        .json(generateErrorResponse("Not Found", "City not found"));
    }

    // Update fields
    existingCity.name = name;
    existingCity.state = stateId;
    existingCity.country = countryId;

    const updatedCity = await existingCity.save();

    return res
      .status(200)
      .json(
        generateResponse(true, "City updated successfully", updatedCity)
      );

  } catch (error) {
    console.log("Update City API Error:", error);
    return res
      .status(500)
      .json(
        generateErrorResponse("Internal Server Error", error.message)
      );
  }
};

module.exports = { updateCity };
