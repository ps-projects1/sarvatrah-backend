const Coupon = require("../../models/coupon");

const couponStats = async (req, res) => {
  const total = await Coupon.countDocuments();
  const active = await Coupon.countDocuments({ status: "active" });
  const inactive = await Coupon.countDocuments({ status: "inactive" });
  const expired = await Coupon.countDocuments({ status: "expired" });

  res.json({
    success: true,
    total,
    active,
    inactive,
    expired,
  });
};

module.exports = { couponStats };
