const { addHolidayPackage } = require("./addHolidayPackage");
const { deleteHolidayPackage } = require("./deleteHolidayPackage");
const { getHolidayPackage } = require("./getHolidayPackage");
const { updateHolidayPackage } = require("./updateHolidayPackage");
const { holidayPackageDetails } = require("./holidayPackageDetails");

module.exports = {
  addHolidayPackage,
  deleteHolidayPackage,
  getHolidayPackage,
  updateHolidayPackage,
  holidayPackageDetails,
};
