const route = require("express").Router();
const upload = require("../config/uploadConfig");
const { generalLimiter, uploadLimiter, limitIfFiles } = require("../middlewares/rateLimit");
const {
  getHolidayPackage,
  addHolidayPackage,
  deleteHolidayPackage,
  holidayPackageDetails,
  userHolidayPackageList
} = require("../controllers/HolidayPackage/holidayPackage.controller");

// Routes with generalLimiter
route.get("/get-holiday-package", generalLimiter, getHolidayPackage);
route.post("/get-holiday-package-details/:id", generalLimiter, holidayPackageDetails);
route.get("/user-holiday-package-list", generalLimiter, userHolidayPackageList);

// Route with file upload → conditional limiter
route.post(
  "/add-holiday-package",
  upload.fields([
    { name: "themeImg", maxCount: 1 },
    { name: "packageImages", maxCount: 10 },
  ]),
  limitIfFiles(uploadLimiter), // only limit if files exist
  addHolidayPackage
);

// Delete holiday package route
route.delete("/delete-holiday-package/:id", generalLimiter, deleteHolidayPackage);

module.exports = route;
