const Coupon = require("../../models/coupon");

const getCoupons = async (req, res) => {
  try {
    let { page = 1, limit = 10, status, discountType, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (discountType) filter.discountType = discountType;
    if (search)
      filter.code = { $regex: new RegExp(search, "i") };

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Coupon.countDocuments(filter),
    ]);

    res.json({ success: true, total, page, limit, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCoupons };
