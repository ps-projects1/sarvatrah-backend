const { getCoupons } = require("./getCoupons");
const { getCouponById } = require("./getCouponById");
const { createCoupon } = require("./createCoupon");
const { updateCoupon } = require("./updateCoupon");
const { deleteCoupon } = require("./deleteCoupon");
const { toggleCoupon } = require("./toggleCoupon");
const { validateCoupon } = require("./validateCoupon");
const { couponStats } = require("./couponStats");

module.exports = {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
  validateCoupon,
  couponStats,
};
