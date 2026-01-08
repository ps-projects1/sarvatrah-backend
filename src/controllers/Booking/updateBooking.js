const Booking = require("../../models/booking");
const mongoose = require("mongoose");

/**
 * PUT /api/bookings/:id
 * Update booking
 */
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const loggedInUser = req.user;

    /* =====================
       VALIDATE BOOKING ID
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
       ACCESS CONTROL
    ===================== */
    const isAdmin = loggedInUser.userRole === 1;
    const isOwner =
      booking.user.toString() === loggedInUser._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    /* =====================
       BUSINESS RULE
    ===================== */
    if (booking.status === "Confirmed") {
      return res.status(400).json({
        success: false,
        message: "Confirmed bookings cannot be updated",
      });
    }

    /* =====================
       ALLOWED UPDATES
    ===================== */
    const allowedFields = [
      "travellers",
      "billingInfo",
      "startDate",
      "endDate",
      "totalTraveller",
    ];

    // Admin-only updates
    if (isAdmin) {
      allowedFields.push("status");
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        booking[field] = req.body[field];
      }
    });

    /* =====================
       TRAVELLER VALIDATION
    ===================== */
    if (booking.travellers) {
      const leadCount = booking.travellers.filter(
        (t) => t.isLeadTraveller
      ).length;

      if (leadCount !== 1) {
        return res.status(400).json({
          success: false,
          message: "There must be exactly one lead traveller",
        });
      }

      if (
        booking.totalTraveller &&
        booking.travellers.length !== booking.totalTraveller
      ) {
        return res.status(400).json({
          success: false,
          message: "Total traveller count mismatch",
        });
      }
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      booking,
    });

  } catch (error) {
    console.error("Update Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating booking",
      error: error.message,
    });
  }
};

module.exports = { updateBooking };
