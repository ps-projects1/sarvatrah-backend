const Refund = require("../../models/refund");
const Booking = require("../../models/booking");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks, refundPercentage } = req.body;

    // Validation
    if (!action || !['approve', 'reject', 'complete', 'fail'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Valid action is required (approve, reject, complete, fail)"
      });
    }

    // Check if refund exists
    const refund = await Refund.findById(id).populate('booking');
    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found"
      });
    }

    // Status transition validation
    const validTransitions = {
      pending: ['approve', 'reject'],
      approved: ['complete', 'fail'],
      processing: ['complete', 'fail'],
      rejected: [],
      completed: [],
      failed: ['approve'] // Allow re-approval of failed refunds
    };

    if (!validTransitions[refund.status].includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Cannot ${action} refund with status ${refund.status}`
      });
    }

    // Prepare update data
    const updateData = {
      processedBy: req.user._id,
      processedAt: new Date(),
      adminRemarks: remarks || refund.adminRemarks
    };

    // Handle different actions
    switch (action) {
      case 'approve':
        updateData.status = 'approved';

        // Update refund percentage if provided
        if (refundPercentage !== undefined && refundPercentage !== refund.refundPercentage) {
          updateData.refundPercentage = refundPercentage;
          updateData.refundAmount = Math.round((refund.originalAmount * refundPercentage) / 100);
        }

        // Update booking status to refund approved
        await Booking.findByIdAndUpdate(refund.booking._id, {
          status: 'Refunded'
        });

        break;

      case 'reject':
        updateData.status = 'rejected';
        break;

      case 'complete':
        try {
          const booking = refund.booking;

          if (!booking?.payment?.paymentId) {
            throw new Error("Payment ID not found for refund");
          }

          const refundAmountInPaise = refund.refundAmount * 100;

          const razorpayRefund = await razorpay.payments.refund(
            booking.payment.paymentId,
            {
              amount: refundAmountInPaise,
              notes: {
                bookingId: booking._id.toString(),
                refundId: refund._id.toString(),
              },
            }
          );

          updateData.status = 'completed';

          updateData['paymentDetails.refundId'] = razorpayRefund.id;
          updateData['paymentDetails.refundTransactionId'] = razorpayRefund.id;
          updateData['paymentDetails.refundedAt'] = new Date();

          updateData['paymentDetails.gatewayResponse'] = razorpayRefund;

          await Booking.findByIdAndUpdate(booking._id, {
            "payment.status": "refunded",
          });

        } catch (err) {
          console.error("Razorpay refund error:", err);

          updateData.status = 'failed';
          updateData['paymentDetails.gatewayResponse'] = {
            status: 'failed',
            message: err.message,
          };
        }

        break;

      case 'fail':
        updateData.status = 'failed';
        updateData['paymentDetails.gatewayResponse'] = {
          status: 'failed',
          message: remarks || 'Refund processing failed',
          failedAt: new Date()
        };
        break;
    }

    // Update refund
    const updatedRefund = await Refund.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('booking', 'totalPrice startDate endDate status')
      .populate('user', 'firstname lastname email')
      .populate('processedBy', 'username email')
      .lean();

    // Send notification to user (implement as needed)
    // await sendRefundStatusNotification(updatedRefund);

    return res.status(200).json({
      success: true,
      data: updatedRefund,
      message: `Refund ${action}d successfully`
    });

  } catch (error) {
    console.error("Process Refund Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing refund",
      error: error.message
    });
  }
};

module.exports = { processRefund };