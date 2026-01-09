const Refund = require("../../models/refund");

const getRefundStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get basic counts
    const [
      total,
      pending,
      approved,
      processing,
      completed,
      rejected,
      failed
    ] = await Promise.all([
      Refund.countDocuments(dateFilter),
      Refund.countDocuments({ ...dateFilter, status: 'pending' }),
      Refund.countDocuments({ ...dateFilter, status: 'approved' }),
      Refund.countDocuments({ ...dateFilter, status: 'processing' }),
      Refund.countDocuments({ ...dateFilter, status: 'completed' }),
      Refund.countDocuments({ ...dateFilter, status: 'rejected' }),
      Refund.countDocuments({ ...dateFilter, status: 'failed' })
    ]);

    // Get total refund amounts
    const refundAmounts = await Refund.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$refundAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRefundAmount = refundAmounts.reduce((sum, item) => {
      if (['completed'].includes(item._id)) {
        return sum + item.totalAmount;
      }
      return sum;
    }, 0);

    const pendingRefundAmount = refundAmounts.reduce((sum, item) => {
      if (['pending', 'approved', 'processing'].includes(item._id)) {
        return sum + item.totalAmount;
      }
      return sum;
    }, 0);

    // Get refund reasons breakdown
    const reasonStats = await Refund.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 },
          totalAmount: { $sum: '$refundAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get priority breakdown
    const priorityStats = await Refund.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get average processing time
    const processingTimeStats = await Refund.aggregate([
      {
        $match: {
          ...dateFilter,
          status: 'completed',
          actualProcessingDays: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgProcessingDays: { $avg: '$actualProcessingDays' },
          minProcessingDays: { $min: '$actualProcessingDays' },
          maxProcessingDays: { $max: '$actualProcessingDays' }
        }
      }
    ]);

    // Get monthly trend (last 12 months)
    const monthlyTrend = await Refund.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$refundAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get recent refunds
    const recentRefunds = await Refund.find(dateFilter)
      .populate('user', 'firstname lastname email')
      .populate('booking', 'totalPrice startDate')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('refundId status refundAmount reason createdAt')
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          total,
          pending,
          approved,
          processing,
          completed,
          rejected,
          failed,
          totalRefundAmount,
          pendingRefundAmount
        },
        breakdown: {
          byReason: reasonStats,
          byPriority: priorityStats,
          byStatus: refundAmounts
        },
        performance: {
          averageProcessingDays: processingTimeStats[0]?.avgProcessingDays || 0,
          minProcessingDays: processingTimeStats[0]?.minProcessingDays || 0,
          maxProcessingDays: processingTimeStats[0]?.maxProcessingDays || 0,
          completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
          approvalRate: total > 0 ? (((approved + completed) / total) * 100).toFixed(2) : 0
        },
        trends: {
          monthly: monthlyTrend
        },
        recent: recentRefunds
      },
      message: "Refund statistics fetched successfully"
    });

  } catch (error) {
    console.error("Get Refund Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching refund statistics",
      error: error.message
    });
  }
};

module.exports = { getRefundStats };