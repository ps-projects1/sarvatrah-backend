const User = require("../../models/user");

const updateCustomer = async (req, res) => {
  try {
    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, userRole: 0 },
      req.body,
      { new: true }
    ).select("-password -tokens");

    if (!updated) {
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
      data: updated,
      message: "Customer updated successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error.message,
      },
    });
  }
};

module.exports = updateCustomer;
