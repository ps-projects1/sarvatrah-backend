const getCustomers = require("./getCustomers");
const getCustomerById = require("./getCustomerById");
const updateCustomer = require("./updateCustomer");
const getCustomerBookings = require("./getCustomerBookings");
const getCustomerTransactions = require("./getCustomerTransactions");

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerBookings,
  getCustomerTransactions,
};
