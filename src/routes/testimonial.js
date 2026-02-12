const express = require("express");
const router = express.Router();
const testimonialController = require("../controllers/Testimonials/testimonial");

// Admin
router.post("/", testimonialController.createTestimonial);
router.get("/", testimonialController.getAllTestimonials);
router.put("/:id", testimonialController.updateTestimonial);
router.delete("/:id", testimonialController.deleteTestimonial);

// Public
router.get("/published", testimonialController.getPublishedTestimonials);

module.exports = router;
