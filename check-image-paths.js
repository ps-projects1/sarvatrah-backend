const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkImages = async () => {
  await connectDB();

  // Check Holiday Packages
  const HolidayPackage = mongoose.model('HolidayPackage', new mongoose.Schema({}, { strict: false }), 'holidaypackages');
  const holidayPackages = await HolidayPackage.find({}).limit(3);

  console.log('\n📦 HOLIDAY PACKAGES (First 3):');
  holidayPackages.forEach((pkg, index) => {
    console.log(`\n${index + 1}. ${pkg.packageName}`);
    console.log('   Theme Image Path:', pkg.themeImg?.path || 'N/A');
    if (pkg.images && pkg.images.length > 0) {
      console.log('   First Package Image Path:', pkg.images[0]?.path || 'N/A');
    }
  });

  // Check Pilgrimage Packages
  const PilgrimagePackage = mongoose.model('PilgrimagePackage', new mongoose.Schema({}, { strict: false }), 'pilgrimagepackages');
  const pilgrimagePackages = await PilgrimagePackage.find({}).limit(3);

  console.log('\n\n🕉️ PILGRIMAGE PACKAGES (First 3):');
  pilgrimagePackages.forEach((pkg, index) => {
    console.log(`\n${index + 1}. ${pkg.packageName}`);
    console.log('   Theme Image Path:', pkg.themeImg?.path || 'N/A');
    if (pkg.images && pkg.images.length > 0) {
      console.log('   First Package Image Path:', pkg.images[0]?.path || 'N/A');
    }
  });

  console.log('\n\n📊 ANALYSIS:');
  console.log('Holiday packages use paths starting with:', holidayPackages[0]?.themeImg?.path?.substring(0, 50) || 'N/A');
  console.log('Pilgrimage packages use paths starting with:', pilgrimagePackages[0]?.themeImg?.path?.substring(0, 50) || 'N/A');

  await mongoose.connection.close();
  console.log('\n✅ Connection closed');
  process.exit(0);
};

checkImages().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
