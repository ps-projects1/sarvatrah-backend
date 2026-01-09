const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    
    description: {
      type: String,
      trim: true,
    },
    
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    
    icon: {
      type: String, // Font icon class or image URL
      default: "fas fa-tag",
    },
    
    color: {
      type: String, // Hex color code for UI
      default: "#007bff",
    },
    
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    sortOrder: {
      type: Number,
      default: 0,
    },
    
    itemCount: {
      type: Number,
      default: 0,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Index for better performance
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ parentCategory: 1 });

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;