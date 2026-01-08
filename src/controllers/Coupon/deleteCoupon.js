const Coupon = require("../../models/coupon");

const deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon)
    return res.status(404).json({ message: "Coupon not found" });

  res.json({ success: true, message: "Coupon deleted" });
};

module.exports = { deleteCoupon };
