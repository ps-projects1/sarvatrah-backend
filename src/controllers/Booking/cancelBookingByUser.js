const Booking = require("../../models/booking");
const mongoose = require("mongoose");

/**
 * PUT /api/bookings/:id/cancel
 * User cancels their own booking
 */
const cancelBookingByUser = async (req, res) => {
  try {
    const { id } = req.params;

    /* =====================
       VALIDATION
    ===================== */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    /* =====================
       FIND BOOKING
    ===================== */
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    /* =====================
       CHECK BOOKING OWNER
    ===================== */
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own booking",
      });
    }

    /* =====================
       ALLOWED STATUS
    ===================== */
    const allowedCancelStatuses = ["PaymentPending", "Confirmed"];

    if (!allowedCancelStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status ${booking.status}`,
      });
    }

    const previousStatus = booking.status;

    /* =====================
       UPDATE STATUS
    ===================== */
    booking.status = "Cancelled";
    booking.payment.status = "failed";

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      bookingId: booking._id,
      previousStatus,
      currentStatus: booking.status,
    });

  } catch (error) {
    console.error("Cancel Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error cancelling booking",
      error: error.message,
    });
  }
};

module.exports = { cancelBookingByUser };