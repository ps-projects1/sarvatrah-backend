const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { HolidayPackage } = require("../../models/holidaysPackage");
const fs = require("fs").promises;
const path = require("path");

const deleteHolidayPackage = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate package ID
    if (!id) {
      return res
        .status(400)
        .json(generateErrorResponse("Bad Request", "Package ID is required"));
    }

    // Find the package to get file paths before deletion
    const packageToDelete = await HolidayPackage.findById(id);

    if (!packageToDelete) {
      return res
        .status(404)
        .json(
          generateErrorResponse("Not Found", "Holiday package not found")
        );
    }

    // Collect all file paths to delete
    const filesToDelete = [];

    // Add theme image if exists
    if (packageToDelete.themeImg?.path) {
      const themeImgPath = packageToDelete.themeImg.path
        .replace("https://sarvatrah-backend.onrender.com/public/", "")
        .replace(/^\//, "");
      filesToDelete.push(path.join(process.cwd(), "public", themeImgPath));
    }

    // Add package images if exist
    if (packageToDelete.images && Array.isArray(packageToDelete.images)) {
      packageToDelete.images.forEach((img) => {
        if (img.path) {
          const imgPath = img.path
            .replace("https://sarvatrah-backend.onrender.com/public/", "")
            .replace(/^\//, "");
          filesToDelete.push(path.join(process.cwd(), "public", imgPath));
        }
      });
    }

    // Add activity images from itinerary if exist
    if (packageToDelete.itinerary && Array.isArray(packageToDelete.itinerary)) {
      packageToDelete.itinerary.forEach((day) => {
        if (day.activities && Array.isArray(day.activities)) {
          day.activities.forEach((activity) => {
            if (activity.image?.path) {
              const activityImgPath = activity.image.path
                .replace("https://sarvatrah-backend.onrender.com/public/", "")
                .replace(/^\//, "");
              filesToDelete.push(
                path.join(process.cwd(), "public", activityImgPath)
              );
            }
          });
        }
      });
    }

    // Delete the package from database
    await HolidayPackage.findByIdAndDelete(id);

    // Delete associated files
    let deletedFilesCount = 0;
    let failedFilesCount = 0;

    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
        deletedFilesCount++;
        console.log(`✅ Deleted file: ${filePath}`);
      } catch (fileError) {
        // File might not exist or already deleted, log but don't fail the request
        console.warn(`⚠️  Could not delete file: ${filePath} - ${fileError.message}`);
        failedFilesCount++;
      }
    }

    console.log(
      `✅ Holiday package deleted: ${packageToDelete.packageName} (ID: ${id})`
    );
    console.log(
      `📁 Files deleted: ${deletedFilesCount}, Failed: ${failedFilesCount}`
    );

    return res
      .status(200)
      .json(
        generateResponse(
          true,
          "Holiday package deleted successfully",
          {
            deletedPackage: {
              id: packageToDelete._id,
              packageName: packageToDelete.packageName,
            },
            filesDeleted: deletedFilesCount,
            filesFailed: failedFilesCount,
          }
        )
      );
  } catch (error) {
    console.error("Delete Holiday Package Error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { deleteHolidayPackage };
