const express = require("express");
const router = express.Router();

const {
  getRefunds,
  getRefundById,
  createRefund,
  updateRefund,
  processRefund,
  getRefundStats,
} = require("../controllers/Refund/refund.controller");

const authMiddleware = require("../middlewares/authMiddleware");
const adminOnlyMiddleware = require("../middlewares/adminOnlyMiddleware");
const { generalLimiter } = require("../middlewares/rateLimit");
const { 
  validateCreateRefund, 
  validateUpdateRefund, 
  validateProcessRefund 
} = require("../middlewares/refundValidation");

// ===================== USER & ADMIN ROUTES =====================

// Get all refunds (admin gets all, users get their own)
router.get(
  "/",
  authMiddleware,
  generalLimiter,
  getRefunds
);

// ===================== ADMIN ONLY ROUTES =====================

// Get refund statistics (must come before /:id route)
router.get(
  "/stats",
  authMiddleware,
  adminOnlyMiddleware,
  generalLimiter,
  getRefundStats
);

// ===================== USER & ADMIN ROUTES (continued) =====================

// Get single refund details
router.get(
  "/:id",
  authMiddleware,
  generalLimiter,
  getRefundById
);

// Create refund request (users can create for their bookings, admins for any)
router.post(
  "/",
  authMiddleware,
  validateCreateRefund,
  generalLimiter,
  createRefund
);

// Update refund (users can update their pending refunds, admins can update any)
router.put(
  "/:id",
  authMiddleware,
  validateUpdateRefund,
  generalLimiter,
  updateRefund
);

// ===================== ADMIN ONLY ROUTES (continued) =====================

// Process refund (approve/reject/complete/fail)
router.put(
  "/:id/process",
  authMiddleware,
  adminOnlyMiddleware,
  validateProcessRefund,
  generalLimiter,
  processRefund
);

module.exports = router;