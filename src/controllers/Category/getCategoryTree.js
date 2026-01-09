const Category = require("../../models/category");

const getCategoryTree = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;

    // Build query
    const query = { parentCategory: null };
    if (!includeInactive) {
      query.isActive = true;
    }

    // Get root categories with their subcategories
    const buildTree = async (parentId = null, level = 0) => {
      const query = { parentCategory: parentId };
      if (!includeInactive) {
        query.isActive = true;
      }

      const categories = await Category.find(query)
        .sort({ sortOrder: 1, name: 1 })
        .lean();

      const tree = [];
      for (const category of categories) {
        const categoryWithChildren = {
          ...category,
          level,
          children: await buildTree(category._id, level + 1)
        };
        tree.push(categoryWithChildren);
      }

      return tree;
    };

    const categoryTree = await buildTree();

    return res.status(200).json({
      success: true,
      data: categoryTree,
      message: "Category tree fetched successfully"
    });

  } catch (error) {
    console.error("Get Category Tree Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching category tree",
      error: error.message
    });
  }
};

module.exports = { getCategoryTree };