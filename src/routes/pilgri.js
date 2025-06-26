const express = require("express");
const packageCollection = require("../models/pilgriPackage");
const upload = require("../utils/file_upload/upload");
const route = express.Router();
const jwt = require("jsonwebtoken");

route.get("/", async (req, res, next) => {
  res.status(200).json({
    message: "pilgri package homepage",
  });
});

route.get("/packages", async (req, res, next) => {
  const packageList = await packageCollection.find({});
  const getIcons = (args) => {
    const temps = [];
    const actCount = { car: 0, hotel: 0, activity: 0 };

    for (const iti of args) {
      for (const act of iti.activities) {
        console.log(act);
        if (!temps.includes(act.activityID)) {
          temps.push(act.activityID);
          if (act.objType == "car") {
            actCount["car"] = actCount.car + 1;
          }
          if (act.objType == "hotel") {
            actCount["hotel"] = actCount.hotel + 1;
          }
          if (act.objType == "activity") {
            actCount["activity"] = actCount.activity + 1;
          }
        } else {
          console.log(false);
        }
      }
    }
    return actCount;
  };
  const filterList = packageList.map((data) => {
    return {
      duration: data.packageDuration,
      image: data.themeImg.path,
      packageName: data.packageName,
      startPlace: data.itinerary.map((iti) => iti.place),
      id: data._id,
      uses: getIcons(data.itinerary),
    };
  });
  res.status(200).json(filterList);
});

route.get("/package/details/:id", async (req, res, next) => {
  const packageID = req.params.id;
  const packageInfo = await packageCollection.findById(packageID);

  res.status(200).json(packageInfo);
});

route.post(
  "/package",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "subfile", maxCount: 10 },
  ]),
  async (req, res, next) => {
    const packageName = req.query.packageName;
    const packageDuration = JSON.parse(req.query.packageDuration);
    const availableVehicle = JSON.parse(req.query.availableVehicle);
    const roomLimit = req.query.roomLimit;
    const include = req.query.include;
    const exclude = req.query.exclude;
    const themeImg = {
      filename: req.files.file[0].filename,
      path:
        "http://127.0.0.1:3232/" +
        req.files.file[0].path.replace("public/", ""),
      mimetype: req.files.file[0].mimetype,
    };
    const imgs = req.files.subfile.map((file) => {
      return {
        filename: file.filename,
        path: "http://127.0.0.1:3232/" + file.path.replace("public/", ""),
        mimetype: file.mimetype,
      };
    });
    await packageCollection.create({
      packageName: packageName,
      packageDuration: packageDuration,
      availableVehicle: availableVehicle,
      roomLimit: roomLimit,
      include: include,
      exclude: exclude,
      themeImg: themeImg,
      imgs: imgs,
    });
    return res.status(200).json({ Status: "Package Created" });
  }
);

route.post("/package/itinerary", async (req, res, next) => {
  const dayCount = req.query.dayCount;
  const packageID = req.query.packageID;
  const place = req.query.place;
  const include = req.query.include;
  const exclude = req.query.exclude;
  const title = req.query.title;
  const itineraryInfo = req.cookies.itineraryData;
  const decryptActivityInfo = jwt.verify(itineraryInfo, process.env.SECRET_KEY);
  console.log(decryptActivityInfo.activities);
  const addItinerary = {
    dayCount: dayCount,
    place: place,
    include: include,
    exclude: exclude,
    title: title,
    activities: decryptActivityInfo.activities,
  };
  const packageInfo = await packageCollection.findById(packageID);
  if (!packageInfo) {
    return res.status(404).json({ error: "Package not found" });
  }
  packageInfo.itinerary.push(addItinerary);
  const updatedPackageInfo = await packageInfo.save();
  res.status(200).json(updatedPackageInfo);
});

module.exports = route;
