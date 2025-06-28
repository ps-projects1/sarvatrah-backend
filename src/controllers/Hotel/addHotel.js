const { hotelCollection } = require("../../models/inventries");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");

const addHotel = async (req, res) => {
  try {
    const {
      hotelType,
      hotelName,
      address,
      state,
      city,
      pincode,
      phoneNumber,
      email,
      contactPerson,
      descriptions,
      active,
      encryptedRooms,
    } = req.body;

    const rooms = JSON.parse(encryptedRooms);

    const imgs = req.files.map(({ filename, path, mimetype }) => ({
      filename,
      path: `http://127.0.0.1:3232/${path
        .replace(/\\/g, "/")
        .replace("public/", "")}`,
      mimetype,
    }));

    const newHotel = await hotelCollection.create({
      hotelType,
      hotelName,
      address,
      state,
      city,
      pincode,
      phoneNumber,
      email,
      contactPerson,
      descriptions,
      imgs,
      rooms,
      active,
    });

    return res
      .status(200)
      .json(generateResponse(true, "Hotel created successfully", newHotel));
  } catch (error) {
    console.error("Add hotel API Error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Some internal server error", error.message));
  }
};

module.exports = { addHotel };
