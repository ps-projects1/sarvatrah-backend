const Coupon = require("../../models/coupon");

const validateCoupon = async (req, res) => {
  const { code } = req.params;
  const { orderAmount, itemType } = req.query;

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon)
    return res.status(404).json({ message: "Invalid coupon code" });

  const now = new Date();

  if (coupon.status !== "active")
    return res.status(400).json({ message: "Coupon not active" });

  if (now < coupon.validFrom || now > coupon.validTo)
    return res.status(400).json({ message: "Coupon expired" });

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    return res.status(400).json({ message: "Coupon usage limit reached" });

  if (orderAmount < coupon.minOrderValue)
    return res.status(400).json({ message: "Minimum order value not met" });

  if (!coupon.applicableOn.includes(itemType))
    return res.status(400).json({ message: "Coupon not applicable" });

  res.json({ success: true, data: coupon });
};

module.exports = { validateCoupon };
