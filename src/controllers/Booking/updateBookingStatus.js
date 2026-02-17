const Booking = require("../../models/booking");
const mongoose = require("mongoose");

/**
 * PUT /api/bookings/:id/status
 * Admin only
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    /* =====================
       VALIDATION
    ===================== */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    /* =====================
       ADMIN CHECK
    ===================== */
    console.log("Update Booking Status - Auth Debug:", {
      userRole: req.user.userRole,
      isAdmin: req.isAdmin,
      userType: req.userType,
      userId: req.user._id,
      userEmail: req.user.email || req.user.username
    });

    if (req.user.userRole !== 1) {
      return res.status(403).json({
        success: false,
        message: "Only admins can update booking status",
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
       ALLOWED TRANSITIONS
    ===================== */
    const allowedTransitions = {
      PaymentPending: ["Confirmed", "Cancelled"],
      Confirmed: ["Cancelled"],
      Cancelled: ["Refunded"],
    };

    const currentStatus = booking.status;

    if (
      !allowedTransitions[currentStatus] ||
      !allowedTransitions[currentStatus].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    /* =====================
       UPDATE STATUS
    ===================== */
    booking.status = status;

    // Payment metadata
    if (status === "Confirmed") {
      booking.payment.status = "paid";
      booking.payment.paidAt = new Date();
    }

    if (status === "Cancelled") {
      booking.payment.status = "failed";
    }

    if (status === "Refunded") {
      booking.payment.status = "refunded";
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      bookingId: booking._id,
      previousStatus: currentStatus,
      currentStatus: booking.status,
    });

  } catch (error) {
    console.error("Update Booking Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating booking status",
      error: error.message,
    });
  }
};

module.exports = { updateBookingStatus };
