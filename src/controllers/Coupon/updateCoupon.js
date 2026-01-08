const Coupon = require("../../models/coupon");

const updateCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  if (!coupon)
    return res.status(404).json({ message: "Coupon not found" });

  res.json({ success: true, message: "Coupon updated", data: coupon });
};

module.exports = { updateCoupon };
