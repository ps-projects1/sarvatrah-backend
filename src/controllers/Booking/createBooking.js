const Booking = require("../../models/Booking");
const holidayPackageModel = require("../../models/holidaysPackage");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const User = require("../../models/user");

const createBooking = async (req, res) => {
  try {
    const {
      userId,
      startDate,
      endDate,
      bookingDate,
      totalPrice,
      totalTraveller,
      vehicleId,
      hotelId,
      packageId,
      travellers,
      billingInfo,
    } = req.body;

    // ✅ Basic required field validation
    if (
      !userId ||
      !startDate ||
      !endDate ||
      !bookingDate ||
      !totalPrice ||
      !totalTraveller ||
      !vehicleId ||
      !hotelId ||
      !packageId
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    // ✅ Check if user exists and role is valid
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.userRole !== 0)
      return res.status(400).json({ message: "Only users can book." });

    // ✅ Validate linked references
    const holidayPackage = await holidayPackageModel.findById(packageId);
    if (!holidayPackage)
      return res.status(404).json({ message: "Holiday package not found." });

    const vehicle = await vehicleCollection.findById(vehicleId);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });

    const hotel = await hotelCollection.findById(hotelId);
    if (!hotel) return res.status(404).json({ message: "Hotel not found." });

    // ✅ Validate travellers data
    if (!Array.isArray(travellers) || travellers.length === 0) {
      return res.status(400).json({ message: "Travellers data is required." });
    }

    // Ensure exactly one lead traveller
    const leadTravellers = travellers.filter((t) => t.isLeadTraveller === true);
    if (leadTravellers.length !== 1) {
      return res.status(400).json({
        message: "There must be exactly one lead traveller in the booking.",
      });
    }

    // ✅ Validate totalTraveller count
    if (travellers.length !== Number(totalTraveller)) {
      return res.status(400).json({
        message: "Total travellers count does not match the provided data.",
      });
    }

    // ✅ Create a new booking
    const newBooking = new Booking({
      user: userId,
      holidayPackageId: packageId,
      vehicleId,
      hotelId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      bookingDate: new Date(bookingDate),
      totalTraveller: Number(totalTraveller),
      totalPrice: Number(totalPrice),
      status: "Pending",
      travellers,
      billingInfo,
    });

    await newBooking.save();

    return res.status(201).json({
      message: "Booking created successfully.",
      booking: newBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return res
      .status(500)
      .json({ message: "Error creating booking", error: error.message });
  }
};

module.exports = { createBooking };
