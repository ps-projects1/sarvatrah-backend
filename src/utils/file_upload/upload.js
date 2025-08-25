const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    if (req.path === "/vehicle") {
      console.log("working");
      callback(null, "public/data/vehicle");
    } else if (req.path.includes("/add-hotel")) {
      callback(null, "public/data/hotel");
    } else if (req.path === "/hotel") {
      callback(null, "public/data/hotel");
    } else if (req.path === "/hotel/add-hotel") {
      callback(null, "public/data/hotel");
    } else if (req.path.includes("/update-hotel")) {
      callback(null, "public/data/hotel");
    } else if (req.baseUrl === "/holidays") {
      callback(null, "public/data/holidays");
    } else if (req.baseUrl === "/activity") {
      callback(null, "public/data/activity");
    } else if (req.baseUrl === "/pilgri") {
      callback(null, "public/data/pilgri");
    } else if (req.baseUrl === "/advanture") {
      callback(null, "public/data/advanture");
    } else if (req.baseUrl === "/activities") {
      console.log(
        "activities images000000000000------------------------------"
      );
      callback(null, "public/data/activities");
    } else if (req.baseUrl === "/experience") {
      callback(null, "public/data/activities");
    }
  },
  filename: function (req, file, callback) {
    console.log("fileName images000000000000------------------------------");

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const originalname = file.originalname;
    const fileExtension = originalname.split(".").pop();
    const newFilename = uniqueSuffix + "." + fileExtension;
    console.log("newFilename------------------", newFilename);
    callback(null, newFilename);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
