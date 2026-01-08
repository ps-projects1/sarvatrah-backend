const Coupon = require("../../models/coupon");

const toggleCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon)
    return res.status(404).json({ message: "Coupon not found" });

  coupon.status = coupon.status === "active" ? "inactive" : "active";
  await coupon.save();

  res.json({
    success: true,
    message: "Coupon status updated",
    status: coupon.status,
  });
};

module.exports = { toggleCoupon };
