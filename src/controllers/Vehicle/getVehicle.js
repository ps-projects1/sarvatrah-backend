const { vehicleCollection } = require("../../models/vehicle");

const getVehicle = async (req, res) => {
  try {
    const response = await vehicleCollection.find({});

    if (!response) {
      return res.status(404).json({
        status: false,
        message: "No data found...",
      });
    }

    return res.status(200).json({
      status: true,
      message: "vehicle data...",
      data: response,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Some internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getVehicle,
};
