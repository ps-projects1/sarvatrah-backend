const express = require("express");
const experienceModel = require("../controllers/experience.controller");
const upload = require("../utils/file_upload/upload");
const { generalLimiter, uploadLimiter, limitIfFiles } = require("../middlewares/rateLimit");

const route = express.Router();

// GET routes → apply generalLimiter
route.get("/", generalLimiter, experienceModel.getAllExperience);
route.get("/:id", generalLimiter, experienceModel.getExperience);

// CRUD routes
route.post("/", generalLimiter, experienceModel.createIntialExperience);
route.put(
  "/:id",
  upload.array("img_link"),
  limitIfFiles(uploadLimiter), // apply only if files are uploaded
  experienceModel.updateExperience
);
route.delete("/:id", generalLimiter, experienceModel.deleteExperience);

// Meeting Point routes
route.post("/meetingPoint/:id", generalLimiter, experienceModel.insertManyMeetingPoint);

// Availability & Timing routes
route.post(
  "/updateAvailability/:id",
  generalLimiter,
  experienceModel.updateExperienceWithAvailability
);
route.post("/updateTiming/:id", generalLimiter, experienceModel.updateExperienceWithTiming);

// Events & Pricing routes
route.post("/events/:id", generalLimiter, experienceModel.calenderEvent);
route.post("/pricing/:id", generalLimiter, experienceModel.insertManyPricing);

module.exports = route;
