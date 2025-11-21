const { hotelCollection } = require("../../models/hotel");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { sendEmail } = require("../../helper/sendMail");
const Joi = require("joi");
const fs = require("fs");
const path = require("path");

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
      descriptions,
      encryptedRooms,
      active,
      defaultSelected = false,
      removedImages,
    } = req.body;

    // Validate defaultSelected
    const schema = Joi.object({
      defaultSelected: Joi.boolean().truthy("true").falsy("false").required(),
    });

    const { error, value } = schema.validate({ defaultSelected });

    if (removedImages) {
      // check file exists or not
      for (const img of JSON.parse(removedImages || "[]")) {
        let imgPath = img.split("/");
        const filePath = path.join(
          __dirname,
          `../../../public/${imgPath[0]}/${imgPath[1]}/${imgPath[2]}`
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath,(err)=>{
            console.log("File remove error >> ",err);
          });
        }

        const removeImageFromDB = await hotelCollection.updateOne(
          { _id },
          { $pull: { imgs: { filename: imgPath } } }
        );
      }
    }

    if (error) {
      return res
        .status(400)
        .json(
          generateErrorResponse("Validation Error", error.details[0].message)
        );
    }

    // check hotel exists by _id
    const prevHotel = await hotelCollection.findById(_id);
    if (!prevHotel) {
      return res.status(404).json(generateErrorResponse("Hotel not found"));
    }

    // check if hotel with same name, state, city, and email already exists
    const existingHotel = await hotelCollection.findOne({
      hotelName: hotelName,
      state: state,
      city: city,
      email: email,
      _id: { $ne: _id }, // Exclude current hotel
    });

    if (existingHotel) {
      return res
        .status(400)
        .json(
          generateErrorResponse(
            "Another hotel already exists with the same name, state, city, and email"
          )
        );
    }

    // check defaultSelected
    if (value.defaultSelected) {
      const existingDefaultHotel = await hotelCollection.findOne({
        state: state,
        city: city,
        defaultSelected: true,
        _id: { $ne: _id },
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

    const rooms = encryptedRooms ? JSON.parse(encryptedRooms) : undefined;

    let imgs = prevHotel.imgs || []; // existing array

    if (req.files && req.files.length > 0) {
      const newImgs = req.files.map(({ filename, path, mimetype }) => ({
        filename,
        path: `http://127.0.0.1:3232/${path
          .replace(/\\/g, "/")
          .replace("public/", "")}`,
        mimetype,
      }));
      imgs.push(...newImgs);
    }

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
      descriptions,
      defaultSelected,
      active,
      ...(rooms && { rooms }),
      ...(imgs && { imgs }),
      updatedAt: new Date(),
    };

    // Detect status change
    const activeChanged = active !== prevHotel.active;
    if (typeof active === "boolean") {
      updateData.active = active;
    }

    const updatedHotel = await hotelCollection.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Send email if status changed
    if (activeChanged) {
      const sender = req.user?.email || "Unknown User"; // assuming auth middleware sets req.user
      const action = active ? "Activated" : "Deactivated";

      const html = `
        <p>Dear Admin,</p>
        <p>The hotel <strong>${hotelName}</strong> (ID: ${_id}) has been <strong>${action}</strong>.</p>
        <h4>Updated By:</h4>
        <ul>
          <li><strong>Email:</strong> ${sender}</li>
        </ul>
        <h4>Hotel Details:</h4>
        <ul>
          <li><strong>Name:</strong> ${hotelName}</li>
          <li><strong>Type:</strong> ${hotelType}</li>
          <li><strong>Location:</strong> ${address}, ${city}, ${state} - ${pincode}</li>
          <li><strong>Phone:</strong> ${phoneNumber}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Contact Person:</strong> ${contactPerson}</li>
          <li><strong>Status:</strong> ${active ? "Active" : "Inactive"}</li>
        </ul>
        <p><em>Timestamp: ${new Date().toLocaleString()}</em></p>
      `;

      await sendEmail({
        to: process.env.ADMIN_EMAIL || "sourabh@sarvatrah.com",
        subject: `Hotel ${action}: ${hotelName}`,
        text: `Hotel ${hotelName} has been ${action} by ${sender}.`,
        html,
      })
        .then((data) => {
          if (!data.success) {
            console.error("Failed to send email:", data.message);
          } else {
            console.log("Email sent successfully:", data.messageId);
          }
        })
        .catch((error) => {
          console.error("Error sending email:", error);
        });
    }

    return res.status(200).json(
      generateResponse(true, "Hotel updated successfully", {
        ...updatedHotel.toObject(),
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
