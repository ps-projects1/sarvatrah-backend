const route = require("express").Router();
const {
  getHotel,
  addHotel,
  deleteHotel,
  updateHotel,
} = require("../controllers/Hotel/hotel.controller");
const upload = require("../utils/file_upload/upload");

route.get("/get-hotels", getHotel);
route.delete("/delete-hotel", deleteHotel);
route.put("/update-hotel", upload.array("files", 10), updateHotel);
route.post("/add-hotel", upload.array("files", 10), addHotel);

module.exports = route;
