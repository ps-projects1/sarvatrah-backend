const Coupon = require("../../models/coupon");
const mongoose = require("mongoose");

const getCouponById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: "Invalid coupon ID" });

  const coupon = await Coupon.findById(req.params.id);
  if (!coupon)
    return res.status(404).json({ message: "Coupon not found" });

  res.json({ success: true, data: coupon });
};

module.exports = { getCouponById };
