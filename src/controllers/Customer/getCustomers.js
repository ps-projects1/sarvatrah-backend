const User = require("../../models/user");

const getCustomers = async (req, res) => {
  try {
    let { page = 1, limit = 10, search } = req.query;
    page = Number(page);
    limit = Number(limit);

    const query = { userRole: 0 };

    if (search) {
      query.$or = [
        { firstname: new RegExp(search, "i") },
        { lastname: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const totalItems = await User.countDocuments(query);

    const customers = await User.find(query)
      .select("-password -tokens")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        items: customers,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
      message: "Customers fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message,
      },
    });
  }
};

module.exports = getCustomers;
