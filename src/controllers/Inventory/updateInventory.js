const Inventory = require("../../models/inventory");

const updateInventory = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!item)
      return res.status(404).json({ message: "Inventory item not found" });

    res.json({
      success: true,
      message: "Inventory updated",
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { updateInventory };
