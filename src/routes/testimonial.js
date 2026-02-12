const express = require("express");
const router = express.Router();
const testimonialController = require("../controllers/Testimonials/testimonial");
const upload = require("../utils/file_upload/upload");

// Admin
router.post(
  "/",
  upload.single("profileImage"),
  testimonialController.createTestimonial
);
router.get("/", testimonialController.getAllTestimonials);
router.put(
  "/:id",
  upload.single("profileImage"), // 👈 important
  testimonialController.updateTestimonial
);
router.delete("/:id", testimonialController.deleteTestimonial);

// Public
router.get("/published", testimonialController.getPublishedTestimonials);

module.exports = router;
