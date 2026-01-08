const Inventory = require("../../models/inventory");

const updateStock = async (req, res) => {
  try {
    const { totalUnits, availableUnits, bookedUnits, blockedUnits } = req.body;

    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        totalUnits,
        availableUnits,
        bookedUnits,
        blockedUnits,
      },
      { new: true }
    );

    if (!item)
      return res.status(404).json({ message: "Inventory item not found" });

    // Auto sold_out logic
    if (item.availableUnits <= 0) {
      item.status = "sold_out";
      await item.save();
    }

    res.json({
      success: true,
      message: "Stock updated",
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { updateStock };
