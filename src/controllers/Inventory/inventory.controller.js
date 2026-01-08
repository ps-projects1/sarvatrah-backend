const { getInventory } = require("./getInventory");
const { getInventoryById } = require("./getInventoryById");
const { createInventory } = require("./createInventory");
const { updateInventory } = require("./updateInventory");
const { updateStock } = require("./updateStock");
const { toggleInventory } = require("./toggleInventory");
const { getAvailability, updateAvailability } = require("./availability");

module.exports = {
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  updateStock,
  toggleInventory,
  getAvailability,
  updateAvailability,
};
