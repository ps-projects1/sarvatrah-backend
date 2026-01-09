const Refund = require("../../models/refund");
const Booking = require("../../models/booking");

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
        updateData.status = 'completed';
        updateData['paymentDetails.refundedAt'] = new Date();
        
        // Here you would integrate with payment gateway to process actual refund
        // For now, we'll simulate it
        updateData['paymentDetails.refundId'] = `refund_${Date.now()}`;
        updateData['paymentDetails.refundTransactionId'] = `txn_${Date.now()}`;
        updateData['paymentDetails.gatewayResponse'] = {
          status: 'success',
          message: 'Refund processed successfully',
          processedAt: new Date()
        };
        
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