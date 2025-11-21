const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { HolidayPackage } = require("../../models/holidaysPackage");

const getHolidayPackage = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count of documents for pagination info
    const totalHolidayPackages = await HolidayPackage.countDocuments({});

    // Find holiday packages with pagination
    const holidayPackages = await HolidayPackage.find(
      {},
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
          "Holiday packages retrieved successfully",
          responseData
        )
      );
  } catch (error) {
    console.log("Get Holiday Packages", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { getHolidayPackage };
