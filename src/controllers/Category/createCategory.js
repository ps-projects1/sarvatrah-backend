const Category = require("../../models/category");

const createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      color,
      parentCategory,
      isActive,
      sortOrder
    } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      });
    }

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ 
      name: name.trim() 
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists"
      });
    }

    // Validate parent category if provided
    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          message: "Parent category not found"
        });
      }
    }

    // Create category
    const categoryData = {
      name: name.trim(),
      description: description?.trim(),
      icon: icon || "fas fa-tag",
      color: color || "#007bff",
      parentCategory: parentCategory || null,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0
    };

    const category = await Category.create(categoryData);

    // Populate the response
    const populatedCategory = await Category.findById(category._id)
      .populate('parentCategory', 'name slug')
      .lean();

    return res.status(201).json({
      success: true,
      data: populatedCategory,
      message: "Category created successfully"
    });

  } catch (error) {
    console.error("Create Category Error:", error);
    
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
      message: "Error creating category",
      error: error.message
    });
  }
};

module.exports = { createCategory };