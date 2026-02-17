const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { HolidayPackage } = require("../../models/holidaysPackage");

const getHolidayPackage = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const { displayHomepage, recommendedPackage } = req.query;

    // Build filter object
    const filter = {};
    if (displayHomepage !== undefined) {
      filter.displayHomepage = displayHomepage === "true";
    }
    if (recommendedPackage !== undefined) {
      filter.recommendedPackage = recommendedPackage === "true";
    }

    let holidayPackages;
    let pagination = null;

    // ✨ CASE 1 — If page & limit BOTH exist → Apply Pagination
    if (page && limit) {
      const skip = (page - 1) * limit;

      const totalHolidayPackages = await HolidayPackage.countDocuments(filter);

      holidayPackages = await HolidayPackage.find(filter, "-__v -createdAt -updatedAt")
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);

      if (!holidayPackages.length) {
        return res
          .status(404)
          .json(generateErrorResponse("Not Found", "No holiday packages found"));
      }

      pagination = {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalHolidayPackages,
        totalPages: Math.ceil(totalHolidayPackages / limit),
        hasNextPage: page * limit < totalHolidayPackages,
        hasPreviousPage: page > 1,
      };

    } else {
      // ✨ CASE 2 — No pagination, return all data
      holidayPackages = await HolidayPackage.find(
        filter,
        "-__v -createdAt -updatedAt"
      ).sort({ _id: -1 });

      if (!holidayPackages.length) {
        return res
          .status(404)
          .json(generateErrorResponse("Not Found", "No holiday packages found"));
      }
    }

    return res
      .status(200)
      .json(
        generateResponse(true, "Holiday packages retrieved successfully", {
          holidayPackages,
          pagination, // null when not paginated
        })
      );
  } catch (error) {
    console.log("Get Holiday Packages", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { getHolidayPackage };
