const { hotelCollection } = require("../../models/inventries");
const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { sendEmail } = require("../../helper/sendMail");

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
    } = req.body;

    const rooms = encryptedRooms ? JSON.parse(encryptedRooms) : undefined;

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

    const prevHotel = await hotelCollection.findById(_id);
    if (!prevHotel) {
      return res.status(404).json(generateErrorResponse("Hotel not found"));
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
      active, // Default to previous value if not provided
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
