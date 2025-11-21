const route = require("express").Router();
const {
  addHolidayPackage,
  deleteHolidayPackage,
  getHolidayPackage,
  updateHolidayPackage,
  holidayPackageDetails,
} = require("../controllers/HolidayPackage/holidayPackage.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../utils/file_upload/upload");

route.get("/holiday-package", getHolidayPackage);
route.get("/holiday-package-details/:id", holidayPackageDetails);
route.delete("/delete-holiday-package", deleteHolidayPackage);
route.put(
  "/update-holiday-package",
  upload.array("files", 10),
  authMiddleware,
  updateHolidayPackage
);
route.post(
  "/add-holiday-package",
  upload.array("files", 10),
  addHolidayPackage
);

module.exports = route;
