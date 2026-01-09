const Refund = require("../../models/refund");

const getRefunds = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      reason, 
      search,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = {};
    
    // For non-admin users, only show their own refunds
    if (req.userType === 'user') {
      query.user = req.user._id;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (reason) {
      query.reason = reason;
    }

    if (priority) {
      query.priority = priority;
    }
    
    if (search) {
      query.$or = [
        { refundId: new RegExp(search, 'i') },
        { reasonDescription: new RegExp(search, 'i') },
        { adminRemarks: new RegExp(search, 'i') }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [refunds, totalItems] = await Promise.all([
      Refund.find(query)
        .populate('booking', 'totalPrice startDate endDate status')
        .populate('user', 'firstname lastname email mobilenumber')
        .populate('processedBy', 'username email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Refund.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        refunds,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems,
          limit: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      },
      message: "Refunds fetched successfully"
    });

  } catch (error) {
    console.error("Get Refunds Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching refunds",
      error: error.message
    });
  }
};

module.exports = { getRefunds };