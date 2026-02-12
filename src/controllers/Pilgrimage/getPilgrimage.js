const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { PilgrimagePackage } = require("../../models/pilgrimage");

const getPilgrimagePackage = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    let pilgrimagePackages;
    let pagination = null;

    // ✨ CASE 1 — If page & limit BOTH exist → Apply Pagination
    if (page && limit) {
      const skip = (page - 1) * limit;

      const totalPilgimagePackages = await PilgrimagePackage.countDocuments();

      pilgrimagePackages = await PilgrimagePackage.find({}, "-__v -createdAt -updatedAt")
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);

      if (!pilgrimagePackages.length) {
        return res
          .status(404)
          .json(generateErrorResponse("Not Found", "No pilgrimage packages found"));
      }

      pagination = {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalPilgimagePackages,
        totalPages: Math.ceil(totalPilgimagePackages / limit),
        hasNextPage: page * limit < totalPilgimagePackages,
        hasPreviousPage: page > 1,
      };

    } else {
      // ✨ CASE 2 — No pagination, return all data
      pilgrimagePackages = await PilgrimagePackage.find(
        {},
        "-__v -createdAt -updatedAt"
      ).sort({ _id: -1 });

      if (!pilgrimagePackages.length) {
        return res
          .status(404)
          .json(generateErrorResponse("Not Found", "No holiday packages found"));
      }
    }

    return res
      .status(200)
      .json(
        generateResponse(true, "Holiday packages retrieved successfully", {
          pilgrimagePackages,
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

module.exports = { getPilgrimagePackage };
