const Booking = require("../../models/booking");

/**
 * GET /api/bookings/stats
 * Admin only
 */
const getBookingStats = async (req, res) => {
  try {
    /* =====================
       ADMIN CHECK
    ===================== */
    if (req.user.userRole !== 1) {
      return res.status(403).json({
        success: false,
        message: "Only admins can access booking statistics",
      });
    }

    /* =====================
       AGGREGATIONS
    ===================== */

    const [
      total,
      confirmed,
      pending,
      cancelled,
      completed,
      revenueResult
    ] = await Promise.all([
      Booking.countDocuments({}),
      Booking.countDocuments({ status: "Confirmed" }),
      Booking.countDocuments({ status: "PaymentPending" }),
      Booking.countDocuments({ status: "Cancelled" }),
      Booking.countDocuments({ status: "Refunded" }),

      // Total revenue from confirmed bookings only
      Booking.aggregate([
        { $match: { status: "Confirmed" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" }
          }
        }
      ])
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return res.status(200).json({
      success: true,
      total,
      confirmed,
      pending,
      cancelled,
      completed,
      totalRevenue
    });

  } catch (error) {
    console.error("Booking Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching booking statistics",
      error: error.message
    });
  }
};

module.exports = { getBookingStats };
