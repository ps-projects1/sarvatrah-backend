const Joi = require("joi");

const createRefundValidationSchema = Joi.object({
  bookingId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Booking ID must be a valid MongoDB ObjectId',
      'any.required': 'Booking ID is required'
    }),

  reason: Joi.string()
    .valid(
      'customer_request',
      'booking_cancellation', 
      'service_unavailable',
      'payment_issue',
      'policy_violation',
      'technical_error',
      'other'
    )
    .required()
    .messages({
      'any.only': 'Invalid reason provided',
      'any.required': 'Reason is required'
    }),

  reasonDescription: Joi.string()
    .trim()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Reason description must be at least 10 characters long',
      'string.max': 'Reason description cannot exceed 1000 characters',
      'any.required': 'Reason description is required'
    }),

  refundPercentage: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Refund percentage must be at least 0',
      'number.max': 'Refund percentage cannot exceed 100'
    }),

  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional()
    .default('medium')
});

const updateRefundValidationSchema = Joi.object({
  reason: Joi.string()
    .valid(
      'customer_request',
      'booking_cancellation',
      'service_unavailable', 
      'payment_issue',
      'policy_violation',
      'technical_error',
      'other'
    )
    .optional(),

  reasonDescription: Joi.string()
    .trim()
    .min(10)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'Reason description must be at least 10 characters long',
      'string.max': 'Reason description cannot exceed 1000 characters'
    }),

  refundPercentage: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Refund percentage must be at least 0',
      'number.max': 'Refund percentage cannot exceed 100'
    }),

  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional(),

  adminRemarks: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Admin remarks cannot exceed 500 characters'
    })
});

const processRefundValidationSchema = Joi.object({
  action: Joi.string()
    .valid('approve', 'reject', 'complete', 'fail')
    .required()
    .messages({
      'any.only': 'Action must be one of: approve, reject, complete, fail',
      'any.required': 'Action is required'
    }),

  remarks: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Remarks cannot exceed 500 characters'
    }),

  refundPercentage: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Refund percentage must be at least 0',
      'number.max': 'Refund percentage cannot exceed 100'
    })
});

const validateCreateRefund = (req, res, next) => {
  const { error } = createRefundValidationSchema.validate(req.body, {
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

const validateUpdateRefund = (req, res, next) => {
  const { error } = updateRefundValidationSchema.validate(req.body, {
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

const validateProcessRefund = (req, res, next) => {
  const { error } = processRefundValidationSchema.validate(req.body, {
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
  validateCreateRefund,
  validateUpdateRefund,
  validateProcessRefund
};