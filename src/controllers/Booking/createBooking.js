const Booking = require("../../models/Booking");
const holidayPackageModel = require("../../models/holidaysPackage");
const { vehicleCollection, hotelCollection } = require("../../models/inventries");
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
    } = req.body;

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
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const status = "Pending";

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.userRole !== 0) return res.status(400).json({ message: "Only user can book" });

    // Check if package exists
    const package = await holidayPackageModel.findById(packageId);
    if (!package) return res.status(404).json({ message: "Holiday package not found" });

    // Check if vehicle exists
    const vehicle = await vehicleCollection.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    // Check if hotel exists
    const hotel = await hotelCollection.findById(hotelId);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    // Create a new booking
    const newBooking = new Booking({
      user: userId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      bookingDate: new Date(bookingDate), // ✅ Convert to Date
      totalPrice: Number(totalPrice),
      totalTraveller: Number(totalTraveller),
      status,
      vehicleId,
      hotelId,
      holidayPackageId: packageId,
    });

    await newBooking.save();

    res.status(201).json({ message: "Booking created successfully", booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: "Error creating booking", error: error.message });
  }
};

module.exports = { createBooking };
