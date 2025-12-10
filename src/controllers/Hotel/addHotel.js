const { hotelCollection } = require("../../models/hotel");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const Joi = require("joi");
const uploadToSupabase = require("../../utils/uploadToSupabase");

const addHotel = async (req, res) => {
  try {
    let {
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
      defaultSelected,
    } = req.body;

    if (!defaultSelected) {
      defaultSelected = false;
    }

    // Joi validation
    const schema = Joi.object({
      defaultSelected: Joi.boolean().truthy("true").falsy("false").required(),
    });

    const { error, value } = schema.validate({ defaultSelected });

    if (error) {
      return res
        .status(400)
        .json(
          generateErrorResponse("Validation Error", error.details[0].message)
        );
    }

    // Check hotel already exists
    const existingHotel = await hotelCollection.findOne({
      hotelName,
      state,
      city,
      email,
    });

    if (existingHotel) {
      return res
        .status(400)
        .json(
          generateErrorResponse(
            "Hotel already exists with the same name, state, city, and email"
          )
        );
    }

    // Validate defaultSelected (only one per city & state)
    if (value.defaultSelected) {
      const existingDefaultHotel = await hotelCollection.findOne({
        state,
        city,
        defaultSelected: true,
      });

      if (existingDefaultHotel) {
        return res.status(400).json(
          generateErrorResponse(
            `Cannot set as default. ${existingDefaultHotel.hotelName} is already the default hotel for ${city}, ${state}`
          )
        );
      }
    }

    // Parse rooms
    const rooms = JSON.parse(encryptedRooms);

    // -------------------------------
    // 🔥 Upload images to Supabase
    // -------------------------------
    const imgs = [];

    for (const file of req.files) {
      const fileUrl = await uploadToSupabase(
        file.path,           // local file saved by multer
        file.originalname,    // actual file name
        "hotels"              // Supabase folder
      );

      imgs.push({
        filename: file.originalname,
        path: fileUrl,
        mimetype: file.mimetype,
      });
    }

    // --------------------------------
    // CREATE HOTEL
    // --------------------------------
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
      defaultSelected: value.defaultSelected || false,
    });

    return res
      .status(200)
      .json(generateResponse(true, "Hotel created successfully", newHotel));
  } catch (error) {
    console.error("Add hotel API Error:", error);
    return res
      .status(500)
      .json(
        generateErrorResponse("Some internal server error", error.message)
      );
  }
};


module.exports = { addHotel };
