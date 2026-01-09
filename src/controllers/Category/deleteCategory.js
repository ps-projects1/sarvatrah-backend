const Category = require("../../models/category");

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // Check if category has subcategories
    const subcategoriesCount = await Category.countDocuments({ 
      parentCategory: id 
    });

    if (subcategoriesCount > 0 && !force) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with subcategories. Use force=true to delete all subcategories.",
        subcategoriesCount
      });
    }

    // Check if category is being used (you can add checks for other models here)
    // Example: Check if any inventory items use this category
    // const inventoryCount = await Inventory.countDocuments({ category: id });
    // if (inventoryCount > 0 && !force) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Cannot delete category that is being used by inventory items",
    //     inventoryCount
    //   });
    // }

    if (force && subcategoriesCount > 0) {
      // Delete all subcategories recursively
      const deleteSubcategories = async (parentId) => {
        const subcategories = await Category.find({ parentCategory: parentId });
        for (const subcat of subcategories) {
          await deleteSubcategories(subcat._id);
          await Category.findByIdAndDelete(subcat._id);
        }
      };

      await deleteSubcategories(id);
    }

    // Delete the category
    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: force && subcategoriesCount > 0 
        ? `Category and ${subcategoriesCount} subcategories deleted successfully`
        : "Category deleted successfully"
    });

  } catch (error) {
    console.error("Delete Category Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error.message
    });
  }
};

module.exports = { deleteCategory };