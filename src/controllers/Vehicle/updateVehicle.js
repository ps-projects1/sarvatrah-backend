const { vehicleCollection } = require("../../models/inventries");

const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Validate the ID
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Vehicle ID is required",
    });
  }

  try {
    // Prepare the update object with only allowed fields
    const allowedFields = [
      "vehicleType",
      "brandName",
      "modelName",
      "inventory",
      "seatLimit",
      "luggageCapacity",
      "rate",
      "facilties",
      "active",
      "vehicleCategory",
      "city",
      "blackout",
    ];

    const updateObject = {};

    // Only include fields that exist in the schema and are provided in the request
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateObject[key] = updateData[key];
      }
    });

    // Check if there are actually fields to update
    if (Object.keys(updateObject).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Add updatedAt timestamp
    updateObject.updatedAt = new Date();

    const updatedVehicle = await vehicleCollection.findByIdAndUpdate(
      id,
      { $set: updateObject },
      { new: true, runValidators: true }
    );

    if (!updatedVehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: updatedVehicle,
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors,
      });
    }

    // Handle cast error (invalid ID format)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  updateVehicle,
};
