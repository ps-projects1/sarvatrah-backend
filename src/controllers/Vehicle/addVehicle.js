const { vehicleCollection } = require("../../models/inventries");

const addVehicle = async (req, res) => {
  const vehicleData = req.body;

  // Basic validation - check if required fields are present
  if (
    !vehicleData.vehicleType ||
    !vehicleData.brandName ||
    !vehicleData.modelName
  ) {
    return res.status(400).json({
      success: false,
      message: "Vehicle type, brand name, and model name are required",
    });
  }

  try {
    // Set default values
    const newVehicle = {
      objectType: "car", // Default value from schema
      vehicleType: vehicleData.vehicleType,
      brandName: vehicleData.brandName,
      modelName: vehicleData.modelName,
      inventory: vehicleData.inventory || 0,
      seatLimit: vehicleData.seatLimit || 0,
      luggageCapacity: vehicleData.luggageCapacity || 0,
      rate: vehicleData.rate || 0,
      facilties: vehicleData.facilties || "",
      active: vehicleData.active !== undefined ? vehicleData.active : true,
      vehicleCategory: vehicleData.vehicleCategory || "",
      city: vehicleData.city || "",
      blackout: vehicleData.blackout || { start: "", end: "" },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create new vehicle document
    const createdVehicle = await vehicleCollection.create(newVehicle);

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      data: createdVehicle,
    });
  } catch (error) {
    console.error("Error adding vehicle:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Vehicle with similar details already exists",
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
  addVehicle,
};
