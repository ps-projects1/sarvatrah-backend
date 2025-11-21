const Activity = require("../../models/activities");

// ----------------------------------------------------------
// GET ACTIVITY BY ID
// ----------------------------------------------------------
exports.getActivityById = async (req, res) => {
    try {
        const { id } = req.params;

        const activity = await Activity.findById(id);

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: "Activity not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Activity fetched successfully",
            data: activity
        });

    } catch (error) {
        console.error("GET ACTIVITY BY ID ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
