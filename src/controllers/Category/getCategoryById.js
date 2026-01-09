const Category = require("../../models/category");

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate('parentCategory', 'name slug')
      .populate('subcategories', 'name slug isActive sortOrder')
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
      message: "Category fetched successfully"
    });

  } catch (error) {
    console.error("Get Category By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching category",
      error: error.message
    });
  }
};

module.exports = { getCategoryById };