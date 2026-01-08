const route = require("express").Router();
const {
  getHotel,
  getHotelById,
  addHotel,
  deleteHotel,
  updateHotel,
} = require("../controllers/Hotel/hotel.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../utils/file_upload/upload");
const { generalLimiter, uploadLimiter, limitIfFiles } = require("../middlewares/rateLimit");

// Apply generalLimiter for get and delete routes
route.get("/get-hotels", generalLimiter, getHotel);
route.get("/:id", generalLimiter, getHotelById);
route.delete("/delete-hotel", authMiddleware, generalLimiter, deleteHotel);

// Apply uploadLimiter conditionally for add and update hotel routes
route.put(
  "/update-hotel",
  upload.array("files", 10),
  authMiddleware,
  limitIfFiles(uploadLimiter),
  updateHotel
);

route.post(
  "/add-hotel",
  upload.array("files", 10),
  authMiddleware,
  limitIfFiles(uploadLimiter),
  addHotel
);

module.exports = route;
