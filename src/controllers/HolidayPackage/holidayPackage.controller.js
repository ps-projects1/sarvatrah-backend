const { addHolidayPackage } = require("./addHolidayPackage");
const { deleteHolidayPackage } = require("./deleteHolidayPackage");
const { getHolidayPackage } = require("./getHolidayPackage");
const { updateHolidayPackage } = require("./updateHolidayPackage");
const { holidayPackageDetails } = require("./holidayPackageDetails");
const { userHolidayPackageList } = require("./userHolidayPackageList");
const { getHomeHolidayPackages } = require("./getHomeHolidayPackages");

module.exports = {
  getHolidayPackage,
  addHolidayPackage,
  deleteHolidayPackage,
  updateHolidayPackage,
  holidayPackageDetails,
  userHolidayPackageList,
  getHomeHolidayPackages,
};
