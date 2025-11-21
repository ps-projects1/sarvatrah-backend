const { HolidayPackage } = require("../../models/holidaysPackage");
// @desc    Get homepage holiday packages
// @route   GET /api/holiday-packages/home
// @access  Public
const getHomeHolidayPackages = async (req, res) => {
  try {
    // Get all homepage packages sorted by latest first
    const packages = await HolidayPackage.find(
      { displayHomepage: true },
      {
        packageName: 1,
        uniqueId: 1,
        destinationCity: 1,
        "themeImg.path": 1,
        vehiclePrices: 1,
        createdAt: 1
      }
    )
      .sort({ createdAt: -1 }) // latest first
      .lean();

    const seenDestinations = new Set();   // To track which cities we have added
    const uniquePackages = [];

    for (const pkg of packages) {
      const primary = pkg.destinationCity?.[0] || "";

      // If destination not added yet, add it
      if (!seenDestinations.has(primary)) {
        seenDestinations.add(primary);

        const lowestPrice = pkg.vehiclePrices?.length
          ? Math.min(...pkg.vehiclePrices.map((v) => v.price))
          : 0;

        uniquePackages.push({
          id: pkg._id,
          name: pkg.packageName,
          destinationCity: pkg.destinationCity,
          primaryDestination: primary,
          image: pkg.themeImg?.path || "",
          startingPrice: lowestPrice,
          createdAt: pkg.createdAt
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Unique homepage packages fetched successfully",
      data: uniquePackages,
    });

  } catch (error) {
    console.error("Home Packages Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


module.exports = { getHomeHolidayPackages };
