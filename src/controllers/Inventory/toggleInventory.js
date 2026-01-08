const Inventory = require("../../models/inventory");

const toggleInventory = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item)
      return res.status(404).json({ message: "Inventory item not found" });

    item.status = item.status === "active" ? "inactive" : "active";
    await item.save();

    res.json({
      success: true,
      message: "Inventory status updated",
      status: item.status,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { toggleInventory };
