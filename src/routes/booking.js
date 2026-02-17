const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");


// Controllers (direct imports)
const bookingController = require("../controllers/Booking/BookingController");
const { calculatePackageCost } = require("../controllers/Booking/calBooking");
const { createPaymentOrder } = require("../controllers/Payment/createOrder");
const { verifyPayment } = require("../controllers/Payment/verifyPayment");
const { createBooking } = require("../controllers/Booking/createBooking");
const { getBookingById } = require("../controllers/Booking/getBookingById");
const { updateBooking } = require("../controllers/Booking/updateBooking");
const { updateBookingStatus } = require("../controllers/Booking/updateBookingStatus");
const { getBookingStats } = require("../controllers/Booking/getBookingStats");

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

router.delete(
  "/:id",
  authMiddleware,
  deleteBooking
);
module.exports = router;
