const Booking = require("../../models/booking");
const mongoose = require("mongoose");

/**
 * DELETE /api/bookings/:id
 * Admin only
 */
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    /* =====================
       VALIDATE ID
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
       ROLE CHECK (ADMIN)
    ===================== */
    console.log("Delete Booking - Auth Debug:", {
      userRole: req.user.userRole,
      isAdmin: req.isAdmin,
      userType: req.userType,
      userId: req.user._id,
      userEmail: req.user.email || req.user.username
    });

    if (req.user.userRole !== 1) {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete bookings",
      });
    }

    /* =====================
       BUSINESS RULE
    ===================== */
    if (booking.status === "Confirmed") {
      return res.status(400).json({
        success: false,
        message: "Confirmed bookings cannot be deleted",
      });
    }

    await Booking.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
      bookingId: id,
    });

  } catch (error) {
    console.error("Delete Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting booking",
      error: error.message,
    });
  }
};

module.exports = { deleteBooking };
