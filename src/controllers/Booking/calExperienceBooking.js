const Experience = require("../../models/experience");

async function calculateExperienceCostInternal(body) {

    try {

        const {
            experienceId,
            pricingId,
            totalTraveller,
            pickupType
        } = body;

        const experience = await Experience
            .findById(experienceId)
            .populate("pricing");

        if (!experience) {
            throw new Error("Experience not found.");
        }

        const pricing = experience.pricing.find(
            p => p._id.toString() === pricingId.toString()
        );

        if (!pricing) {
            throw new Error("Pricing option not found.");
        }

        const travellerCount = Number(totalTraveller);

        const basePrice = Number(pricing.price || 0);

        const experienceCost =
            basePrice * travellerCount;

        let pickupCharge = 0;

        if (
            pickupType &&
            experience.travelling_facility?.[pickupType]
        ) {
            pickupCharge = Number(
                experience.travelling_facility[pickupType].price || 0
            );
        }

        /*
            Future Ready
        */

        const priceMarkup =
            Number(experience.priceMarkup || 0);

        const subtotal =
            experienceCost + pickupCharge;

        const markupAmount =
            subtotal * priceMarkup / 100;

        const finalPackage =
            subtotal + markupAmount;

        return {

            success: true,

            finalPackage,

            breakdown: {

                travellerCount,

                basePrice,

                experienceCost,

                pickupCharge,

                subtotal,

                markupPercentage: priceMarkup,

                markupAmount,

                finalPackage
            }
        };

    } catch (err) {

        return {

            success: false,

            message: err.message
        };
    }
}

module.exports = {
    calculateExperienceCostInternal
};