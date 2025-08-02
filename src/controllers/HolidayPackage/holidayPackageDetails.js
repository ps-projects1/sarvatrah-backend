const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { HolidayPackage } = require("../../models/holidaysPackage");

const holidayPackageDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const holidayPackage = await HolidayPackage.findById(
      id,
      "-__v -createdAt -updatedAt"
    );

    if (!holidayPackage) {
      return res
        .status(404)
        .json(generateErrorResponse("Not Found", "Holiday package not found"));
    }

    return res
      .status(200)
      .json(
        generateResponse(
          true,
          "Holiday package details retrieved successfully",
          holidayPackage
        )
      );
  } catch (error) {
    console.log("Get Holiday Package Details", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { holidayPackageDetails };
