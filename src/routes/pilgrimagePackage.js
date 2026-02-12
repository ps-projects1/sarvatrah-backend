const route = require("express").Router();
const upload = require("../config/uploadConfig");
const { generalLimiter, uploadLimiter, limitIfFiles } = require("../middlewares/rateLimit");
const {
  getPilgrimagePackage,
  addPilrimagePackage,
  deletePilgrimagePackage,
  updatePilgrimagePackage,
  pilgrimagePackageDetails,
  userPilgrimagePackageList
} = require("../controllers/Pilgrimage/pilgrimage.controller");

// Routes with generalLimiter
route.get("/get-pilrimage-package", generalLimiter, getPilgrimagePackage);
route.post("/get-pilgrimage-package-details/:id", generalLimiter, pilgrimagePackageDetails);
route.get("/user-pilgrimage-package-list", generalLimiter, userPilgrimagePackageList);

// Route with file upload → conditional limiter
route.post(
  "/add-pilgrimage-package",
  upload.fields([
    { name: "themeImg", maxCount: 1 },
    { name: "packageImages", maxCount: 10 },
  ]),
  limitIfFiles(uploadLimiter), // only limit if files exist
  addPilrimagePackage
);

// Update holiday package route
route.put(
  "/update-pilgrimage-package",
  upload.fields([
    { name: "themeImg", maxCount: 1 },
    { name: "packageImages", maxCount: 10 },
  ]),
  limitIfFiles(uploadLimiter),
  updatePilgrimagePackage
);

// Delete holiday package route
route.delete("/delete-pilgrimage-package/:id", generalLimiter, deletePilgrimagePackage);

module.exports = route;
