const User = require("../../models/user");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const uploadToSupabase = require("../../utils/uploadToSupabase");

const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if file was uploaded
    if (!req.file) {
      return res
        .status(400)
        .json(generateErrorResponse("No file uploaded"));
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json(generateErrorResponse("User not found"));
    }

    // Upload to Supabase
    let profilePictureUrl;
    try {
      profilePictureUrl = await uploadToSupabase(
        req.file.path,
        req.file.originalname,
        "profile-pictures",
        "hotel-images"
      );
      console.log("Profile picture uploaded:", profilePictureUrl);
    } catch (uploadError) {
      console.error("Supabase upload failed:", uploadError);
      // Fallback to local path
      profilePictureUrl = `/data/profile/${req.file.filename}`;
      console.log("Using local path as fallback:", profilePictureUrl);
    }

    // Update user profile picture
    user.profilePicture = profilePictureUrl;
    await user.save();

    return res
      .status(200)
      .json(
        generateResponse(
          true,
          "Profile picture uploaded successfully",
          {
            profilePicture: profilePictureUrl,
          }
        )
      );
  } catch (error) {
    console.error("Upload profile picture API Error:", error);
    return res
      .status(500)
      .json(
        generateErrorResponse("Internal server error", error.message)
      );
  }
};

module.exports = { uploadProfilePicture };
