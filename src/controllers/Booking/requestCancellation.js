const Booking = require("../../models/booking");
const Refund = require("../../models/refund");
const mongoose = require("mongoose");

const requestCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: "Cancellation reason is required" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only cancel your own booking" });
    }

    if (!["PaymentPending", "Confirmed"].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel booking with status ${booking.status}` });
    }

    const existingRefund = await Refund.findOne({
      booking: id,
      status: { $nin: ["rejected", "completed"] },
    });

    if (existingRefund) {
      return res.status(409).json({ success: false, message: "A cancellation request already exists for this booking" });
    }

    const daysUntilStart = Math.ceil(
      (new Date(booking.startDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    let refundPercentage = 0;
    if (daysUntilStart >= 30) refundPercentage = 90;
    else if (daysUntilStart >= 15) refundPercentage = 75;
    else if (daysUntilStart >= 7) refundPercentage = 50;
    else if (daysUntilStart >= 3) refundPercentage = 25;

    const refundAmount = Math.round((booking.totalPrice * refundPercentage) / 100);

    booking.status = "Cancelled";
    booking.payment.status = "failed";
    await booking.save();

    const refund = await Refund.create({
      booking: id,
      user: booking.user,
      originalAmount: booking.totalPrice,
      refundAmount,
      refundPercentage,
      reason: "booking_cancellation", 
  reasonDescription: reason, 
      priority: "medium",
      paymentDetails: {
        provider: booking.payment?.provider || "razorpay",
        transactionId: booking.payment?.paymentId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cancellation request submitted. Our team will review and process your refund.",
      data: {
        bookingId: booking._id,
        status: booking.status,
        refundAmount,
        refundPercentage,
        refundId: refund._id,
      },
    });

  } catch (error) {
    console.error("Request Cancellation Error:", error);
    return res.status(500).json({ success: false, message: "Error submitting cancellation request", error: error.message });
  }
};

module.exports = { requestCancellation };