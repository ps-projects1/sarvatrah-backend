const Inventory = require("../../models/inventory");
const mongoose = require("mongoose");

const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid inventory ID" });

    const item = await Inventory.findById(id);
    if (!item)
      return res.status(404).json({ message: "Inventory item not found" });

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getInventoryById };
