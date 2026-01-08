const route = require("express").Router();

const {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
  validateCoupon,
  couponStats,
} = require("../controllers/Coupon/coupon.controller");

const authMiddleware = require("../middlewares/authMiddleware");
const adminOnlyMiddleware = require("../middlewares/adminOnlyMiddleware");

// ===================== ADMIN ROUTES =====================

// List all coupons
route.get(
  "/",
  authMiddleware,
  adminOnlyMiddleware,
  getCoupons
);

// Coupon statistics
route.get(
  "/stats",
  authMiddleware,
  adminOnlyMiddleware,
  couponStats
);

// Get single coupon
route.get(
  "/:id",
  authMiddleware,
  adminOnlyMiddleware,
  getCouponById
);

// Create coupon
route.post(
  "/",
  authMiddleware,
  adminOnlyMiddleware,
  createCoupon
);

// Update coupon
route.put(
  "/:id",
  authMiddleware,
  adminOnlyMiddleware,
  updateCoupon
);

// Delete coupon
route.delete(
  "/:id",
  authMiddleware,
  adminOnlyMiddleware,
  deleteCoupon
);

// Activate / Deactivate coupon
route.put(
  "/:id/toggle",
  authMiddleware,
  adminOnlyMiddleware,
  toggleCoupon
);

// ===================== USER / PUBLIC ROUTES =====================

// Validate coupon code (used during booking)
route.get(
  "/validate/:code",
  validateCoupon
);

module.exports = route;
