const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const Booking = require("../models/booking");



// Controllers (direct imports)
const bookingController = require("../controllers/Booking/BookingController");
const { calculatePackageCost } = require("../controllers/Booking/calBooking");
const { createPaymentOrder } = require("../controllers/Payment/createOrder");
const { verifyPayment } = require("../controllers/Payment/verifyPayment");
const { createBooking, createExperienceBooking } = require("../controllers/Booking/createBooking");
const { getBookingById } = require("../controllers/Booking/getBookingById");
const { updateBooking } = require("../controllers/Booking/updateBooking");
const { updateBookingStatus } = require("../controllers/Booking/updateBookingStatus");
const { getBookingStats } = require("../controllers/Booking/getBookingStats");
const { cancelBookingByUser } = require("../controllers/Booking/cancelBookingByUser");
const { requestCancellation } = require("../controllers/Booking/requestCancellation");


// Admin controllers
const { fetchAllBookings } = require("../controllers/Booking/fetchAllBookings");
const { deleteBooking } = require("../controllers/Booking/deleteBooking");


const router = express.Router();

/* =========================
   BOOKING CREATION
========================= */

router.post(
  "/createbooking",
  authMiddleware,
  bookingController.createBooking.createBooking
);

router.post(
  "/createExperienceBooking",
  authMiddleware,
  bookingController.createBooking.createExperienceBooking
);


/* =========================
   FETCH BOOKINGS
========================= */

// Admin – fetch all bookings (with filters)
router.get(
  "/",
  authMiddleware,
  fetchAllBookings
);

// User – fetch own bookings
router.get(
  "/fetchUserBooking",
  authMiddleware,
  bookingController.fetchBooking.fetchBookingByUser
);

/* =========================
   CALCULATE PACKAGE COST
========================= */

// No auth required - users can calculate price before logging in
router.post(
  "/calculateBooking",
  calculatePackageCost
);

/* =========================
   PAYMENT
========================= */

router.post(
  "/payment/create-order/:bookingId",
  authMiddleware,
  createPaymentOrder
);

router.post(
  "/payment/verify",
  authMiddleware,
  verifyPayment
);

router.post(
  "/payment/complete",
  authMiddleware,
  bookingController.createBooking.completePaymentOrder
);

/* =========================
   DELETE BOOKING
========================= */

/* =========================
   BOOKING STATS
========================= */

router.get(
  "/stats",
  authMiddleware,
  getBookingStats
);

/* =========================
   BOOKING CRUD OPERATIONS
========================= */

router.post(
  "/",
  authMiddleware,
  createBooking
);

router.get(
  "/:id",
  authMiddleware,
  getBookingById
);

router.put(
  "/:id",
  authMiddleware,
  updateBooking
);

router.put(
  "/:id/status",
  authMiddleware,
  updateBookingStatus
);

router.put(
  "/:id/status",
  authMiddleware,
  cancelBookingByUser
);

router.post(
  "/:id/request-cancellation",
  authMiddleware,
  requestCancellation
);

router.get(
  "/:id/invoice",
  authMiddleware,
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found" });
      }
      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
      if (!booking.invoice) {
        return res.status(404).json({ success: false, message: "Invoice not available yet" });
      }
      return res.json({ success: true, invoiceUrl: booking.invoice });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

router.delete(
  "/:id",
  authMiddleware,
  deleteBooking
);
module.exports = router;
