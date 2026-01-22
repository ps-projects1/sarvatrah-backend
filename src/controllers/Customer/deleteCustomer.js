const User = require("../../models/user");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json(generateErrorResponse("Invalid user ID format"));
    }

    // Find user by ID
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json(generateErrorResponse("User not found"));
    }

    // Prevent deletion of super admin (userRole: 3)
    if (user.userRole === 3) {
      return res
        .status(403)
        .json(
          generateErrorResponse(
            "Cannot delete super admin user",
            "Forbidden operation"
          )
        );
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    return res
      .status(200)
      .json(
        generateResponse(
          true,
          "User deleted successfully",
          {
            deletedUserId: id,
            email: user.email,
            name: `${user.firstname || ""} ${user.lastname || ""}`.trim(),
          }
        )
      );
  } catch (error) {
    console.error("Delete customer API Error:", error);
    return res
      .status(500)
      .json(
        generateErrorResponse("Internal server error", error.message)
      );
  }
};

module.exports = deleteCustomer;
