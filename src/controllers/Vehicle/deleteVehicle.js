const { vehicleCollection } = require("../../models/vehicle");

const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  // Validate the ID
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Vehicle ID is required",
    });
  }

  try {
    // Find and delete the vehicle
    const deletedVehicle = await vehicleCollection.findByIdAndDelete(id);

    if (!deletedVehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
      data: {
        id: deletedVehicle._id,
        brandName: deletedVehicle.brandName,
        modelName: deletedVehicle.modelName,
      },
    });
  } catch (error) {
    console.error("Error deleting vehicle:", error);

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
  deleteVehicle,
};
