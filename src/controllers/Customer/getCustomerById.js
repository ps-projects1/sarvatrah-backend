const User = require("../../models/user");

const getCustomerById = async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      userRole: 0,
    }).select("-password -tokens");

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Customer not found",
        },
      });
    }

    return res.json({
      success: true,
      data: customer,
      message: "Customer details fetched",
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

module.exports = getCustomerById;
