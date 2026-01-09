const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      required: true,
      unique: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    refundAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    refundPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    reason: {
      type: String,
      enum: [
        "customer_request",
        "booking_cancellation",
        "service_unavailable",
        "payment_issue",
        "policy_violation",
        "technical_error",
        "other"
      ],
      required: true,
    },

    reasonDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: [
        "pending",      // Initial request
        "approved",     // Admin approved
        "rejected",     // Admin rejected
        "processing",   // Payment gateway processing
        "completed",    // Refund successful
        "failed"        // Refund failed
      ],
      default: "pending",
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    processedAt: {
      type: Date,
    },

    adminRemarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    paymentDetails: {
      provider: {
        type: String,
        enum: ["razorpay", "manual"],
        default: "razorpay",
      },
      
      refundId: String,        // Payment gateway refund ID
      transactionId: String,   // Original transaction ID
      refundTransactionId: String, // Refund transaction ID
      
      refundedAt: Date,
      
      gatewayResponse: {
        type: mongoose.Schema.Types.Mixed,
      },
    },

    timeline: [
      {
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "processing", "completed", "failed"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        remarks: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },
      }
    ],

    attachments: [
      {
        filename: String,
        path: String,
        mimetype: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      }
    ],

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    estimatedProcessingDays: {
      type: Number,
      default: 7,
    },

    actualProcessingDays: {
      type: Number,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for processing duration
refundSchema.virtual('processingDuration').get(function() {
  if (this.processedAt && this.createdAt) {
    return Math.ceil((this.processedAt - this.createdAt) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Pre-save middleware to generate refund ID
refundSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Refund').countDocuments();
    this.refundId = `REF${Date.now()}${String(count + 1).padStart(4, '0')}`;
    
    // Add initial timeline entry
    this.timeline.push({
      status: 'pending',
      remarks: 'Refund request created',
      timestamp: new Date(),
    });
  }
  next();
});

// Pre-save middleware to update timeline
refundSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      remarks: this.adminRemarks || `Status changed to ${this.status}`,
      updatedBy: this.processedBy,
    });

    if (this.status === 'completed' && !this.actualProcessingDays) {
      this.actualProcessingDays = Math.ceil((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
    }
  }
  next();
});

// Indexes for better performance
refundSchema.index({ refundId: 1 });
refundSchema.index({ booking: 1 });
refundSchema.index({ user: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ reason: 1 });
refundSchema.index({ createdAt: -1 });
refundSchema.index({ processedAt: -1 });

const Refund = mongoose.model("Refund", refundSchema);
module.exports = Refund;