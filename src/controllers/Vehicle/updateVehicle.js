const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { vehicleCollection } = require("../../models/vehicle");
const { sendEmail } = require("../../helper/sendMail");

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate the ID
    if (!id) {
      return res
        .status(400)
        .json(generateErrorResponse("Vehicle ID is required"));
    }

    const allowedFields = [
      "vehicleType",
      "brandName",
      "modelName",
      "inventory",
      "seatLimit",
      "luggageCapacity",
      "rate",
      "facilties",
      "active",
      "vehicleCategory",
      "city",
      "blackout",
    ];

    const updateObject = {};

    // Only include fields that exist in the schema and are provided in the request
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateObject[key] = updateData[key];
      }
    });

    // Check if there are actually fields to update
    if (Object.keys(updateObject).length === 0) {
      return res
        .status(400)
        .json(generateErrorResponse("No valid fields to update"));
    }

    // Get the previous vehicle data to check for active status change
    const prevVehicle = await vehicleCollection.findById(id);
    if (!prevVehicle) {
      return res.status(404).json(generateErrorResponse("Vehicle not found"));
    }

    // Detect status change
    const activeChanged =
      typeof updateObject.active === "boolean" &&
      updateObject.active !== prevVehicle.active;

    // Add updatedAt timestamp
    updateObject.updatedAt = new Date();

    const updatedVehicle = await vehicleCollection.findByIdAndUpdate(
      id,
      { $set: updateObject },
      { new: true, runValidators: true }
    );

    if (!updatedVehicle) {
      return res.status(404).json(generateErrorResponse("Vehicle not found"));
    }

    // Send email if status changed
    if (activeChanged) {
      const sender = req.user?.email || "Unknown User"; // assuming auth middleware sets req.user
      const action = updateObject.active ? "Activated" : "Deactivated";

      const html = `
        <p>Dear Admin,</p>
        <p>The vehicle <strong>${updatedVehicle.brandName} ${
        updatedVehicle.modelName
      }</strong> (ID: ${id}) has been <strong>${action}</strong>.</p>
        <h4>Updated By:</h4>
        <ul>
          <li><strong>Email:</strong> ${sender}</li>
        </ul>
        <h4>Vehicle Details:</h4>
        <ul>
          <li><strong>Type:</strong> ${updatedVehicle.vehicleType}</li>
          <li><strong>Brand:</strong> ${updatedVehicle.brandName}</li>
          <li><strong>Model:</strong> ${updatedVehicle.modelName}</li>
          <li><strong>Seat Limit:</strong> ${updatedVehicle.seatLimit}</li>
          <li><strong>Rate:</strong> ${updatedVehicle.rate}</li>
          <li><strong>Status:</strong> ${
            updateObject.active ? "Active" : "Inactive"
          }</li>
        </ul>
        <p><em>Timestamp: ${new Date().toLocaleString()}</em></p>
      `;

      await sendEmail({
        to: process.env.ADMIN_EMAIL || "sourabh@sarvatrah.com",
        subject: `Vehicle ${action}: ${updatedVehicle.brandName} ${updatedVehicle.modelName}`,
        text: `Vehicle ${updatedVehicle.brandName} ${updatedVehicle.modelName} has been ${action} by ${sender}.`,
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

    res
      .status(200)
      .json(
        generateResponse(true, "Vehicle updated successfully", updatedVehicle)
      );
  } catch (error) {
    console.log("Update Vehicle API : ", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal server error", error.message));
  }
};

module.exports = {
  updateVehicle,
};
