const Refund = require("../../models/refund");

const updateRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      reason,
      reasonDescription,
      refundPercentage,
      priority,
      adminRemarks
    } = req.body;

    // Check if refund exists
    const existingRefund = await Refund.findById(id);
    if (!existingRefund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found"
      });
    }

    // Check if refund can be updated
    if (existingRefund.status === 'completed' || existingRefund.status === 'processing') {
      return res.status(400).json({
        success: false,
        message: "Cannot update refund that is completed or being processed"
      });
    }

    // For non-admin users, only allow updates to their own pending refunds
    if (req.userType === 'user') {
      if (existingRefund.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own refund requests"
        });
      }

      if (existingRefund.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: "You can only update pending refund requests"
        });
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (reason !== undefined) updateData.reason = reason;
    if (reasonDescription !== undefined) updateData.reasonDescription = reasonDescription;
    if (priority !== undefined) updateData.priority = priority;
    
    // Only admins can update admin remarks
    if (req.userType === 'admin' && adminRemarks !== undefined) {
      updateData.adminRemarks = adminRemarks;
    }

    // Recalculate refund amount if percentage changed
    if (refundPercentage !== undefined && refundPercentage !== existingRefund.refundPercentage) {
      updateData.refundPercentage = refundPercentage;
      updateData.refundAmount = Math.round((existingRefund.originalAmount * refundPercentage) / 100);
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

    return res.status(200).json({
      success: true,
      data: updatedRefund,
      message: "Refund updated successfully"
    });

  } catch (error) {
    console.error("Update Refund Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating refund",
      error: error.message
    });
  }
};

module.exports = { updateRefund };