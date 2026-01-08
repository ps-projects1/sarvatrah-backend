const route = require("express").Router();
const {
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  updateStock,
  toggleInventory,
  getAvailability,
  updateAvailability,
} = require("../controllers/Inventory/inventory.controller");

const authMiddleware = require("../middlewares/authMiddleware");

route.get("/", authMiddleware, getInventory);
route.get("/:id", authMiddleware, getInventoryById);

route.post("/", authMiddleware, createInventory);
route.put("/:id", authMiddleware, updateInventory);
route.put("/:id/stock", authMiddleware, updateStock);
route.put("/:id/toggle", authMiddleware, toggleInventory);

route.get("/:id/availability", authMiddleware, getAvailability);
route.put("/:id/availability", authMiddleware, updateAvailability);

module.exports = route;
