const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
    // OLD FIELDS
    objectType: { type: String, default: "activity" },
    packageType: { type: String, required: true },
    activityName: { type: String, required: true },
    activityPlace: { type: String, required: true },
    targetPlaces: [String],
    duration: { type: Number },
    placeCover: { type: Number },
    price: { type: Number },
    img: {
        filename: String,
        path: String,
        mimetype: String
    },
    description: { type: String },

    // NEW FIELDS
    title: { type: String, required: true },

    location: {
        address: { type: String, required: true },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },

    groupSize: { type: Number },

    // ARRAY OF TRANSPORT TYPES
    publicTransportUsed: [{ type: String }],

    overview: { type: String },

    availableLanguages: [String],

    // UPDATED: FULL CANCELLATION POLICY DOCUMENT
    cancellationPolicy: {
        isRefundable: { type: Boolean, default: false },
        refundPercentage: { type: Number, default: 0 },
        cancellationWindowHours: { type: Number },    // e.g., cancel before 24 hours
        policyDescription: { type: String }           // full text policy
    },

    included: [String],

    excluded: [String],

    pricePerPerson: { type: Number },

    // UPDATED SCHEDULE STRUCTURE
    schedule: [
        {
            startDate: { type: Date, required: true },   // NEW
            endDate: { type: Date, required: true },     // NEW
            startTime: { type: String },
            endTime: { type: String }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("activity", activitySchema);
