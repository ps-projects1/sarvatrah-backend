const Joi = require("joi");

const categoryValidationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Category name is required',
      'string.min': 'Category name must be at least 2 characters long',
      'string.max': 'Category name cannot exceed 100 characters'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  icon: Joi.string()
    .trim()
    .max(100)
    .optional()
    .default('fas fa-tag'),

  color: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional()
    .default('#007bff')
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code (e.g., #007bff)'
    }),

  parentCategory: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .optional()
    .messages({
      'string.pattern.base': 'Parent category must be a valid MongoDB ObjectId'
    }),

  isActive: Joi.boolean()
    .optional()
    .default(true),

  sortOrder: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0)
    .messages({
      'number.min': 'Sort order must be a non-negative integer'
    })
});

const categoryUpdateValidationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Category name must be at least 2 characters long',
      'string.max': 'Category name cannot exceed 100 characters'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  icon: Joi.string()
    .trim()
    .max(100)
    .optional(),

  color: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional()
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code (e.g., #007bff)'
    }),

  parentCategory: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .optional()
    .messages({
      'string.pattern.base': 'Parent category must be a valid MongoDB ObjectId'
    }),

  isActive: Joi.boolean()
    .optional(),

  sortOrder: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Sort order must be a non-negative integer'
    })
});

const validateCategory = (req, res, next) => {
  const { error } = categoryValidationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors
    });
  }

  next();
};

const validateCategoryUpdate = (req, res, next) => {
  const { error } = categoryUpdateValidationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors
    });
  }

  next();
};

module.exports = {
  validateCategory,
  validateCategoryUpdate
};