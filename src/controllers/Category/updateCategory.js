const Category = require("../../models/category");

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      icon,
      color,
      parentCategory,
      isActive,
      sortOrder
    } = req.body;

    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // Validation
    if (name && name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category name cannot be empty"
      });
    }

    // Check if updating name and it conflicts with existing
    if (name && name.trim() !== existingCategory.name) {
      const nameConflict = await Category.findOne({ 
        name: name.trim(),
        _id: { $ne: id }
      });

      if (nameConflict) {
        return res.status(409).json({
          success: false,
          message: "Category with this name already exists"
        });
      }
    }

    // Validate parent category if provided
    if (parentCategory && parentCategory !== existingCategory.parentCategory?.toString()) {
      // Prevent self-reference
      if (parentCategory === id) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be its own parent"
        });
      }

      // Check if parent exists
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          message: "Parent category not found"
        });
      }

      // Prevent circular reference (parent cannot be a child of this category)
      const checkCircular = async (categoryId, targetParentId) => {
        const parent = await Category.findById(targetParentId);
        if (!parent) return false;
        if (parent.parentCategory?.toString() === categoryId) return true;
        if (parent.parentCategory) {
          return await checkCircular(categoryId, parent.parentCategory.toString());
        }
        return false;
      };

      const isCircular = await checkCircular(id, parentCategory);
      if (isCircular) {
        return res.status(400).json({
          success: false,
          message: "Cannot create circular reference in category hierarchy"
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (parentCategory !== undefined) updateData.parentCategory = parentCategory || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parentCategory', 'name slug').lean();

    return res.status(200).json({
      success: true,
      data: updatedCategory,
      message: "Category updated successfully"
    });

  } catch (error) {
    console.error("Update Category Error:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Category with this ${field} already exists`
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error updating category",
      error: error.message
    });
  }
};

module.exports = { updateCategory };