const route = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminOnlyMiddleware = require("../middlewares/adminOnlyMiddleware");

const {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerBookings,
  getCustomerTransactions,
} = require("../controllers/Customer/customer.controller");

route.get("/", authMiddleware, adminOnlyMiddleware, getCustomers);
route.get("/:id", authMiddleware, adminOnlyMiddleware, getCustomerById);
route.put("/:id", authMiddleware, adminOnlyMiddleware, updateCustomer);
route.delete("/:id", authMiddleware, adminOnlyMiddleware, deleteCustomer);
route.get("/:id/bookings", authMiddleware, adminOnlyMiddleware, getCustomerBookings);
route.get("/:id/transactions", authMiddleware, adminOnlyMiddleware, getCustomerTransactions);

module.exports = route;

