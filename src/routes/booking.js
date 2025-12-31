const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const bookingController = require("../controllers/Booking/BookingController");
const { calculatePackageCost } = require("../controllers/Booking/calBooking");

const { createPaymentOrder } = require("../controllers/Payment/createOrder");
const { verifyPayment } = require("../controllers/Payment/verifyPayment");

const router = express.Router();

// Create a new booking
router.post(
  "/createbooking",
    authMiddleware,
  bookingController?.createBooking?.createBooking
);


router.get(
  "/fetchBooking",
  authMiddleware,
  bookingController.fetchBooking.fetchBooking
);

router.get(
  "/fetchUserBooking",
    authMiddleware,
  bookingController.fetchBooking.fetchBookingByUser
)


router.post(
  "/calculateBooking",
  
  calculatePackageCost
)

router.post(
  "/payment/create-order/:bookingId",
  authMiddleware,
  createPaymentOrder
);

// Verify Razorpay payment (frontend callback)
router.post(
  "/payment/verify",
  authMiddleware,
  verifyPayment
);

// Get a single booking by ID
// router.get('/:id', bookingController.getBookingById);

// Update a booking by ID
// router.put('/:id', bookingController.updateBooking);

// Delete a booking by ID
// router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
