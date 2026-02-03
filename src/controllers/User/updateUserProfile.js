const User = require("../../models/user");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const Joi = require("joi");

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstname, lastname, mobilenumber } = req.body;

    // Validation schema
    const schema = Joi.object({
      firstname: Joi.string().trim().min(1).max(50),
      lastname: Joi.string().trim().min(1).max(50),
      mobilenumber: Joi.number().integer().min(1000000000).max(9999999999),
    });

    const { error } = schema.validate(req.body);

    if (error) {
      return res
        .status(400)
        .json(
          generateErrorResponse("Validation Error", error.details[0].message)
        );
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json(generateErrorResponse("User not found"));
    }

    // Update only provided fields
    if (firstname !== undefined) user.firstname = firstname;
    if (lastname !== undefined) user.lastname = lastname;
    if (mobilenumber !== undefined) user.mobilenumber = mobilenumber;

    await user.save();

    // Return updated user without sensitive data
    const updatedUser = await User.findById(userId).select("-password -tokens");

    return res
      .status(200)
      .json(
        generateResponse(
          true,
          "Profile updated successfully",
          updatedUser
        )
      );
  } catch (error) {
    console.error("Update user profile API Error:", error);
    return res
      .status(500)
      .json(
        generateErrorResponse("Internal server error", error.message)
      );
  }
};

module.exports = { updateUserProfile };
