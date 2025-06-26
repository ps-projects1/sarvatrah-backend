const { hotelCollection } = require("../../models/inventries");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");

const updateHotel = async (req, res) => {
  try {
    const {
      _id,
      hotelType,
      hotelName,
      address,
      state,
      city,
      pincode,
      phoneNumber,
      email,
      contactPerson,
      description,
      rooms: encryptedRooms,
    } = req.body;

    // Parse the rooms data if it exists
    const rooms = encryptedRooms ? JSON.parse(encryptedRooms) : undefined;

    // Handle file uploads if any files were uploaded
    let imgs;
    if (req.files && req.files.length > 0) {
      imgs = req.files.map(({ filename, path, mimetype }) => ({
        filename,
        path: `http://127.0.0.1:3232/${path
          .replace(/\\/g, "/")
          .replace("public/", "")}`,
        mimetype,
      }));
    }

    // Prepare update data
    const updateData = {
      hotelType,
      hotelName,
      address,
      state,
      city,
      pincode,
      phoneNumber,
      email,
      contactPerson,
      description,
      ...(rooms && { rooms }), // Only include rooms if provided
      ...(imgs && { imgs }), // Only include images if new files were uploaded
      updatedAt: new Date(), // Add update timestamp
    };

    // Find and update the hotel
    const updatedHotel = await hotelCollection.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedHotel) {
      return res.status(404).json(generateErrorResponse("Hotel not found"));
    }

    return res.status(200).json(
      generateResponse(true, "Hotel updated successfully", {
        ...updatedHotel.toObject(),
        // If new images were uploaded, use them, otherwise keep existing ones
        imgs: imgs || updatedHotel.imgs,
      })
    );
  } catch (error) {
    console.error("Update hotel API Error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Some internal server error", error.message));
  }
};

module.exports = { updateHotel };
