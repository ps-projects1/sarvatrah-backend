const { getCategories } = require("./getCategories");
const { getCategoryById } = require("./getCategoryById");
const { getCategoryTree } = require("./getCategoryTree");
const { createCategory } = require("./createCategory");
const { updateCategory } = require("./updateCategory");
const { deleteCategory } = require("./deleteCategory");
const { toggleCategory } = require("./toggleCategory");

module.exports = {
  getCategories,
  getCategoryById,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategory,
};