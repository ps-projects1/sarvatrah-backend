const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const bookingController = require("../controllers/Booking/BookingController");

const router = express.Router();

// Create a new booking
router.post(
  "/createbooking",
  authMiddleware,
  bookingController?.createBooking?.createBooking
);

// Get all bookings
router.get(
  "/fetchBooking",
  authMiddleware,
  bookingController.fetchBooking.fetchBooking
);

// Get a single booking by ID
// router.get('/:id', bookingController.getBookingById);

// Update a booking by ID
// router.put('/:id', bookingController.updateBooking);

// Delete a booking by ID
// router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
