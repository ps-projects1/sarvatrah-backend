const Inventory = require("../../models/inventory");

const getInventory = async (req, res) => {
  try {
    let { page = 1, limit = 10, itemType, status, search } = req.query;

    const filter = {};
    if (itemType) filter.itemType = itemType;
    if (status) filter.status = status;
    if (search)
      filter.itemName = { $regex: new RegExp(search, "i") };

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Inventory.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Inventory.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page,
      limit,
      data: items,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getInventory };
