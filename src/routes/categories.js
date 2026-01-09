const express = require("express");
const router = express.Router();

const {
  getCategories,
  getCategoryById,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategory,
} = require("../controllers/Category/category.controller");

const authMiddleware = require("../middlewares/authMiddleware");
const adminOnlyMiddleware = require("../middlewares/adminOnlyMiddleware");
const { generalLimiter } = require("../middlewares/rateLimit");
const { validateCategory, validateCategoryUpdate } = require("../middlewares/categoryValidation");

// ===================== PUBLIC ROUTES =====================

// Get all categories (public access for frontend display)
router.get(
  "/",
  generalLimiter,
  getCategories
);

// Get category tree structure (public access)
router.get(
  "/tree",
  generalLimiter,
  getCategoryTree
);

// Get single category by ID (public access)
router.get(
  "/:id",
  generalLimiter,
  getCategoryById
);

// ===================== ADMIN ROUTES =====================

// Create new category
router.post(
  "/",
  authMiddleware,
  adminOnlyMiddleware,
  validateCategory,
  generalLimiter,
  createCategory
);

// Update category
router.put(
  "/:id",
  authMiddleware,
  adminOnlyMiddleware,
  validateCategoryUpdate,
  generalLimiter,
  updateCategory
);

// Toggle category status (activate/deactivate)
router.patch(
  "/:id/toggle",
  authMiddleware,
  adminOnlyMiddleware,
  generalLimiter,
  toggleCategory
);

// Delete category
router.delete(
  "/:id",
  authMiddleware,
  adminOnlyMiddleware,
  generalLimiter,
  deleteCategory
);

module.exports = router;