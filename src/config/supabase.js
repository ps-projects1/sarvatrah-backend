const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase configuration missing!");
  console.error("SUPABASE_URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
  console.error("SUPABASE_ANON_KEY:", supabaseKey ? "✓ Set" : "✗ Missing");
} else {
  console.log("✓ Supabase URL:", supabaseUrl);
  console.log("✓ Supabase Key:", supabaseKey ? `${supabaseKey.substring(0, 20)}...` : "Missing");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
