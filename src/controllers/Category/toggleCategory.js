const Category = require("../../models/category");

const toggleCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // Toggle the isActive status
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { isActive: !category.isActive },
      { new: true }
    ).populate('parentCategory', 'name slug').lean();

    return res.status(200).json({
      success: true,
      data: updatedCategory,
      message: `Category ${updatedCategory.isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error("Toggle Category Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error toggling category status",
      error: error.message
    });
  }
};

module.exports = { toggleCategory };