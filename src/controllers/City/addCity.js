const City = require("../../models/city");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");

const addCity = async (req, res) => {
  try {
    const { name, stateId, countryId = "686f500f55aed15b4d9f0697" } = req.body;

    // Validate required fields
    if (!name || !stateId || !countryId) {
      return res
        .status(400)
        .json(generateErrorResponse("Bad Request", "All fields are required"));
    }

    // Create new city
    const newCity = new City({
      name,
      state: stateId,
      country: countryId,
    });

    // Save the city to the database
    const savedCity = await newCity.save();

    return res
      .status(201)
      .json(generateResponse(true, "City added successfully", savedCity));
  } catch (error) {
    console.log("Add City API Error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { addCity };
