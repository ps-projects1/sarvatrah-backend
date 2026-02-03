const User = require("../../models/user");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");

const getUserProfile = async (req, res) => {
  try {
    // Get user ID from authenticated request
    const userId = req.user._id;

    // Find user and exclude password
    const user = await User.findById(userId).select("-password -tokens");

    if (!user) {
      return res
        .status(404)
        .json(generateErrorResponse("User not found"));
    }

    return res
      .status(200)
      .json(
        generateResponse(
          true,
          "User profile retrieved successfully",
          user
        )
      );
  } catch (error) {
    console.error("Get user profile API Error:", error);
    return res
      .status(500)
      .json(
        generateErrorResponse("Internal server error", error.message)
      );
  }
};

module.exports = { getUserProfile };
