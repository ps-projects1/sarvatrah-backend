const { hotelCollection } = require("../../models/hotel");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const Joi = require("joi");

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
    
    if(!defaultSelected)
    {
      defaultSelected = false;
    }
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

    // check hotel already exists or not
    const existingHotel = await hotelCollection.findOne({
      hotelName: hotelName,
      state: state,
      city: city,
      email: email,
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

    if (value.defaultSelected) {
      const existingDefaultHotel = await hotelCollection.findOne({
        state: state,
        city: city,
        defaultSelected: true,
      });

      if (existingDefaultHotel) {
        return res
          .status(400)
          .json(
            generateErrorResponse(
              `Cannot set as default. ${existingDefaultHotel.hotelName} is already the default hotel for ${city}, ${state}`
            )
          );
      }
    }

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
      defaultSelected: defaultSelected || false,
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
