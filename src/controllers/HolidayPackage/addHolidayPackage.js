const { generateErrorResponse } = require("../../helper/response");
const { hotelCollection } = require("../../models/hotel");

const addHolidayPackage = async (req, res) => {
  try {

    

  } catch (error) {
    console.log("Add Holiday Package API :", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { addHolidayPackage };
