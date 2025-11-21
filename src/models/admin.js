const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tokens: [{ token: { type: String }, expiresAt: { type: Date } }],
});

// Hash password before saving
// adminSchema.pre('save', async function(next) {
//     if (this.isModified('password') || this.isNew) {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//     }
//     next();
// });

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
