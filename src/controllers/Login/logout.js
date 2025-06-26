const User = require("../../models/user");
const { generateErrorResponse } = require("../../helper/response");

const logout = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "user not found" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    // Clear all tokens for the user
    user.tokens = []; // Empty the array
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "user logout successfully" });
  } catch (error) {
    console.log("Logout API : ", error);

    return res
      .status(500)
      .json(generateErrorResponse("Some internal server error", error.message));
  }
};

module.exports = {
  logout,
};
