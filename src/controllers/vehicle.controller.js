const { vehicleCollection } = require("../models/inventries");

const getVehicles = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  try {
    const vehicles = await vehicleCollection.find().sort({ _id: -1 }); // Sort by '_id' in descending order
    // .skip(skip)
    // .limit(parseInt(limit));

    const total = await vehicleCollection.countDocuments();

    res.status(200).json({
      // total,
      // page: parseInt(page),
      // limit: parseInt(limit),
      // totalPages: Math.ceil(total / limit),
      vehicles,
    });
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * async (req, res, next) => {
  const vehicleType = req.query.vehicleType || false;
  const brandName = req.query.brandName || false;
  const modelName = req.query.modelName || false;
  if (!vehicleType && !brandName) {
    console.log(vehicleCollection);
    const getVehicleType = await vehicleCollection.distinct("vehicleType");
    return res.status(200).json({ data: getVehicleType });
  } else if (vehicleType) {
    const getBrandName = await vehicleCollection.find({
      vehicleType: vehicleType,
    });
    return res.status(200).json({ data: getBrandName });
  } else if (brandName) {
    const getModelName = await vehicleCollection.find({ brandName: brandName });
    return res.status(200).json({ data: getModelName });
  }

   
}
 */

module.exports = { getVehicles };
