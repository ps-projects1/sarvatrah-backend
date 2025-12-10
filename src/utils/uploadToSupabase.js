const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");

async function uploadToSupabase(localFilePath, originalName, folder = "uploads") {
  try {
    // Read file from local disk (multer saved it)
    const fileBuffer = fs.readFileSync(localFilePath);

    const ext = path.extname(originalName); // .jpg, .png
    const uniqueName = `${folder}/${Date.now()}-${Math.random()}${ext}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from("sarvatrah-bucket") // replace with your bucket name
      .upload(uniqueName, fileBuffer, {
        upsert: true,
        contentType: `image/${ext.replace(".", "")}`
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from("sarvatrah-bucket")
      .getPublicUrl(uniqueName);

    // Delete local file (optional)
    fs.unlinkSync(localFilePath);

    return publicData.publicUrl;

  } catch (err) {
    console.error("uploadToSupabase Error:", err);
    throw err;
  }
}

module.exports = uploadToSupabase;
