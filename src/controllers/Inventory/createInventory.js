const Inventory = require("../../models/inventory");

const createInventory = async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json({
      success: true,
      message: "Inventory item created",
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createInventory };
