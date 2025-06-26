const dbs = require('mongoose')


const activityPackage = dbs.Schema({
    objectType:{type:String,default:'activities'},
    packageName: String,
    packageDuration: String,
    themeImg:{filename:String,path:String,mimetype:String},
    availableVehicle:[{vehicleType:String,price:Number}],
    groupSize:Number,
    include:[String],
    exclude:[String],
    startLocation: String,
    activityLocation:String,
    imgs:[{filename:String,path:String,mimetype:String}],
    discount:String,
    price: Number,
    overview: String,
    availableLanguage: [String],
    cancellationPolicy:String,
    highlight:String,
    mapLink:String,
    unEligibility:{age:[Number],diseases:[String]},
    availableSlot:Number,
    pickUpAndDrop: Boolean,
    pickUpOnly: Boolean,
    dropOnly: Boolean,
    pickUpLocation: String,
    dropLocation: String,
      // ageTypes: {
      //   adult: Boolean,
      //   children: Boolean,
      //   senior: Boolean,
      // },
    age: {
      adult: String,
      children: String,
      senior: String,
    },

})

const activitySchema = dbs.model('activityPackages',activityPackage)
module.exports = activitySchema 