const Refund = require("../../models/refund");

const getRefundById = async (req, res) => {
  try {
    const { id } = req.params;

    // Build query with user access control
    const query = { _id: id };
    if (req.userType === 'user') {
      query.user = req.user._id;
    }

    const refund = await Refund.findOne(query)
      .populate('booking', 'totalPrice startDate endDate status holidayPackageId')
      .populate('user', 'firstname lastname email mobilenumber')
      .populate('processedBy', 'username email')
      .populate('timeline.updatedBy', 'username email')
      .populate({
        path: 'booking',
        populate: {
          path: 'holidayPackageId',
          select: 'packageName packageDuration destinationCity'
        }
      })
      .lean();

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: refund,
      message: "Refund details fetched successfully"
    });

  } catch (error) {
    console.error("Get Refund By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching refund details",
      error: error.message
    });
  }
};

module.exports = { getRefundById };