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

    // Total documents
    const totalHolidayPackages = await HolidayPackage.countDocuments({});

    // Query holiday packages with pagination + sorting (latest first)
    const holidayPackages = await HolidayPackage.find(
      {},
      "-__v -createdAt -updatedAt"
    )
      .sort({ _id: -1 })   // ⭐ ensures latest first  
      .skip(skip)
      .limit(limit);

    if (!holidayPackages || holidayPackages.length === 0) {
      return res
        .status(404)
        .json(generateErrorResponse("Not Found", "No holiday packages found"));
    }

    // Total pages
    const totalPages = Math.ceil(totalHolidayPackages / limit);

    // Response with pagination info
    const responseData = {
      holidayPackages,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalHolidayPackages,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    return res.status(200).json(
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
