const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { HolidayPackage } = require("../../models/holidaysPackage");

const getHolidayPackage = async (req, res) => {
  try {
    const holidayPackage = await HolidayPackage.find(
      {},
      "-__v -createdAt -updatedAt"
    );

    if (!holidayPackage || holidayPackage.length === 0) {
      return res
        .status(404)
        .json(generateErrorResponse("Not Found", "No holiday packages found"));
    }

    return res
      .status(200)
      .json(
        generateResponse(
          true,
          "Holiday packages retrieved successfully",
          holidayPackage
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
