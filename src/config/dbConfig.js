const mongoose = require('mongoose')


const dbConnection = async () => {
  try {
    await mongoose.connect('mongodb+srv://sarvatrah23:Sarvatrah%402023@sarvatrah.2xrxc8c.mongodb.net/sarvatrah', {
      dbName:'sarvatrah',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('connected');
  } catch (e) {
    console.log('error in db connection ' + e);
  }
}


// mongodb+srv://sarvatrah23:Sarvatrah%402023@sarvatrah.2xrxc8c.mongodb.net/sarvatrah



module.exports = dbConnection