const Category = require("../../models/category");

const getCategories = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      isActive, 
      parentCategory,
      sortBy = 'sortOrder',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (parentCategory !== undefined) {
      query.parentCategory = parentCategory === 'null' ? null : parentCategory;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [categories, totalItems] = await Promise.all([
      Category.find(query)
        .populate('parentCategory', 'name slug')
        .populate('subcategories', 'name slug isActive')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Category.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems,
          limit: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      },
      message: "Categories fetched successfully"
    });

  } catch (error) {
    console.error("Get Categories Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message
    });
  }
};

module.exports = { getCategories };