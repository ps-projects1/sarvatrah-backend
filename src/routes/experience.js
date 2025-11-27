const express = require("express");
const experienceModel = require("../controllers/experience.controller");
const upload = require("../utils/file_upload/upload");
const route = express.Router();

route.get("/", experienceModel.getAllExperience);


route
  .get("/:id", experienceModel.getExperience)
  .post("/", experienceModel.createIntialExperience)
  .put("/:id",upload.array("img_link"), experienceModel.updateExperience)
  .delete("/:id", experienceModel.deleteExperience);
route.post("/meetingPoint/:id", experienceModel.insertManyMeetingPoint);
route.post(
  "/updateAvailability/:id",
  experienceModel.updateExperienceWithAvailability
);

route.post("/meetingPoint/:id", experienceModel.insertManyMeetingPoint);

route.post("/events/:id", experienceModel.calenderEvent);
route.post("/updateTiming/:id", experienceModel.updateExperienceWithTiming);
route.post("/pricing/:id", experienceModel.insertManyPricing);
module.exports = route;
