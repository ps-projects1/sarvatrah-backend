const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");

async function uploadToSupabase(localFilePath, originalName, folder = "uploads") {
  try {
    console.log(`[Supabase] Starting upload for: ${originalName}`);
    console.log(`[Supabase] Local path: ${localFilePath}`);
    console.log(`[Supabase] Folder: ${folder}`);

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File not found at path: ${localFilePath}`);
    }

    // Read file from local disk (multer saved it)
    const fileBuffer = fs.readFileSync(localFilePath);
    console.log(`[Supabase] File size: ${fileBuffer.length} bytes`);

    const ext = path.extname(originalName); // .jpg, .png
    const uniqueName = `${folder}/${Date.now()}-${Math.random()}${ext}`;
    console.log(`[Supabase] Unique name: ${uniqueName}`);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from("sarvatrah-bucket") // replace with your bucket name
      .upload(uniqueName, fileBuffer, {
        upsert: true,
        contentType: `image/${ext.replace(".", "")}`
      });

    if (error) {
      console.error("[Supabase] Upload error:", error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    console.log(`[Supabase] Upload successful, getting public URL...`);

    // Get public URL
    const { data: publicData } = supabase.storage
      .from("sarvatrah-bucket")
      .getPublicUrl(uniqueName);

    if (!publicData || !publicData.publicUrl) {
      throw new Error("Failed to get public URL from Supabase");
    }

    console.log(`[Supabase] Public URL: ${publicData.publicUrl}`);

    // Delete local file (optional)
    try {
      fs.unlinkSync(localFilePath);
      console.log(`[Supabase] Local file deleted: ${localFilePath}`);
    } catch (unlinkError) {
      console.warn(`[Supabase] Failed to delete local file: ${unlinkError.message}`);
    }

    return publicData.publicUrl;

  } catch (err) {
    console.error("[Supabase] uploadToSupabase Error:", err);
    throw err;
  }
}

module.exports = uploadToSupabase;
