const Inventory = require("../../models/inventory");

const getAvailability = async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item)
    return res.status(404).json({ message: "Inventory item not found" });

  res.json({ success: true, availability: item.availability });
};

const updateAvailability = async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item)
    return res.status(404).json({ message: "Inventory item not found" });

  item.availability = req.body.availability;
  await item.save();

  res.json({
    success: true,
    message: "Availability updated",
    availability: item.availability,
  });
};

module.exports = { getAvailability, updateAvailability };
