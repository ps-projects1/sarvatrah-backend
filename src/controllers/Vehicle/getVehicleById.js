const mongoose = require("mongoose");
const {
  generateResponse,
  generateErrorResponse,
} = require("../../helper/response");
const { vehicleCollection } = require("../../models/vehicle");

/**
 * GET /api/vehicle/:id
 * Get single vehicle
 */
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔍 Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json(generateErrorResponse("Invalid vehicle ID"));
    }

    const vehicle = await vehicleCollection.findById(id);

    if (!vehicle) {
      return res
        .status(404)
        .json(generateErrorResponse("Vehicle not found"));
    }

    return res.status(200).json(
      generateResponse(true, "Vehicle details fetched successfully", {
        vehicle,
      })
    );

  } catch (error) {
    console.log("Get vehicle by ID error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Some internal server error", error.message));
  }
};

module.exports = { getVehicleById };
