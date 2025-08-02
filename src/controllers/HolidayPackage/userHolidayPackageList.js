const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { HolidayPackage } = require("../../models/holidaysPackage");

const userHolidayPackageList = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter parameters
    const { packageType, nights } = req.query;

    // Build the filter object
    const filter = {};

    // Add theme filter if provided
    if (packageType) {
      filter.packageType = packageType;
    }

    // Add duration filter if provided
    if (nights) {
      const nightsNum = parseInt(nights);
      if (!isNaN(nightsNum)) {
        if (nights.startsWith("<")) {
          filter["packageDuration.nights"] = { $lt: nightsNum };
        } else if (nights.startsWith(">")) {
          filter["packageDuration.nights"] = { $gt: nightsNum };
        } else if (nights.includes("-")) {
          const [minNights, maxNights] = nights.split("-").map(Number);
          filter["packageDuration.nights"] = {
            $gte: minNights,
            $lte: maxNights,
          };
        } else {
          filter["packageDuration.nights"] = nightsNum;
        }
      }
    }
    console.log("Filter Object:", filter);
    

    // Get total count of documents for pagination info
    const totalHolidayPackages = await HolidayPackage.countDocuments(filter);

    // Find holiday packages with pagination and filters
    const holidayPackages = await HolidayPackage.find(
      filter,
      "-__v -createdAt -updatedAt"
    )
      .skip(skip)
      .limit(limit);

    if (!holidayPackages || holidayPackages.length === 0) {
      return res
        .status(404)
        .json(generateErrorResponse("Not Found", "No holiday packages found"));
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalHolidayPackages / limit);

    // Response data with pagination info
    const responseData = {
      holidayPackages: holidayPackages,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalHolidayPackages,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    return res
      .status(200)
      .json(
        generateResponse(
          true,
          "User holiday packages retrieved successfully",
          responseData
        )
      );
  } catch (error) {
    console.log("User Holiday Package List", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { userHolidayPackageList };
