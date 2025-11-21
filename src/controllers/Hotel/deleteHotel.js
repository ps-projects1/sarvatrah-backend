const {
  generateResponse,
  generateErrorResponse,
} = require("../../helper/response");
const { hotelCollection } = require("../../models/hotel");
const fs = require("fs");
const path = require("path");

const deleteHotel = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res
        .status(400)
        .json(generateErrorResponse("Please provide hotel ID."));
    }

    const hotel = await hotelCollection.findById(_id);

    if (!hotel) {
      return res.status(404).json(generateErrorResponse("Hotel not found."));
    }

    // Delete associated images from the filesystem
    if (hotel.imgs && hotel.imgs.length > 0) {
      for (const img of hotel.imgs) {
        let imgPath = img.filename;
        const filePath = path.join(
          __dirname,
          `../../../public/data/hotel/${imgPath}`
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath, (err) => {
            console.log("File remove error >> ", err);
          });
        }
      }
    }

    await hotelCollection.findByIdAndDelete(_id);

    return res
      .status(200)
      .json(generateResponse(true, "Hotel removed successfully."));
  } catch (error) {
    console.error("Delete hotel API error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal server error.", error.message));
  }
};

module.exports = {
  deleteHotel,
};
