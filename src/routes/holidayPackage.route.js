const route = require("express").Router();
const upload = require("../config/uploadConfig");
const {
  getHolidayPackage,
  addHolidayPackage,
  holidayPackageDetails,
  userHolidayPackageList
} = require("../controllers/HolidayPackage/holidayPackage.controller");

// Route
route.get("/get-holiday-package", getHolidayPackage);
route.get("/get-holiday-package-details/:id", holidayPackageDetails);
route.post(
  "/add-holiday-package",
  upload.fields([
    { name: "themeImg", maxCount: 1 },
    { name: "packageImages", maxCount: 10 },
  ]),
  addHolidayPackage
);

// User Holiday Package List
route.get("/user-holiday-package-list", userHolidayPackageList);

module.exports = route;
