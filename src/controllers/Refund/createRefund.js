const Refund = require("../../models/refund");
const Booking = require("../../models/booking");

const createRefund = async (req, res) => {
  try {
    const {
      bookingId,
      reason,
      reasonDescription,
      refundPercentage,
      priority = "medium"
    } = req.body;

    // Validation
    if (!bookingId || !reason || !reasonDescription) {
      return res.status(400).json({
        success: false,
        message: "Booking ID, reason, and reason description are required"
      });
    }

    // Check if booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Check if user owns the booking (for non-admin users)
    if (req.userType === 'user' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only create refund requests for your own bookings"
      });
    }

    // Check if refund already exists for this booking
    const existingRefund = await Refund.findOne({ 
      booking: bookingId,
      status: { $nin: ['rejected', 'completed'] }
    });

    if (existingRefund) {
      return res.status(409).json({
        success: false,
        message: "A refund request already exists for this booking",
        existingRefundId: existingRefund.refundId
      });
    }

    // Calculate refund amount
    const originalAmount = booking.totalPrice;
    let calculatedRefundPercentage = refundPercentage;

    // If no percentage provided, calculate based on cancellation policy
    if (!refundPercentage) {
      const daysUntilStart = Math.ceil((booking.startDate - new Date()) / (1000 * 60 * 60 * 24));
      
      // Default cancellation policy
      if (daysUntilStart >= 30) {
        calculatedRefundPercentage = 90;
      } else if (daysUntilStart >= 15) {
        calculatedRefundPercentage = 75;
      } else if (daysUntilStart >= 7) {
        calculatedRefundPercentage = 50;
      } else if (daysUntilStart >= 3) {
        calculatedRefundPercentage = 25;
      } else {
        calculatedRefundPercentage = 0;
      }
    }

    const refundAmount = Math.round((originalAmount * calculatedRefundPercentage) / 100);

    // Create refund request
    const refundData = {
      booking: bookingId,
      user: booking.user,
      originalAmount,
      refundAmount,
      refundPercentage: calculatedRefundPercentage,
      reason,
      reasonDescription,
      priority,
      paymentDetails: {
        provider: booking.payment?.provider || "razorpay",
        transactionId: booking.payment?.paymentId,
      }
    };

    const refund = await Refund.create(refundData);

    // Populate the response
    const populatedRefund = await Refund.findById(refund._id)
      .populate('booking', 'totalPrice startDate endDate status')
      .populate('user', 'firstname lastname email')
      .lean();

    return res.status(201).json({
      success: true,
      data: populatedRefund,
      message: "Refund request created successfully"
    });

  } catch (error) {
    console.error("Create Refund Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating refund request",
      error: error.message
    });
  }
};

module.exports = { createRefund };