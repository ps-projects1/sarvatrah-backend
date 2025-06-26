const dbs = require('mongoose')

const advanturePackage = dbs.Schema({
    objectType:{type:String,default:'advanture'},
    packageName: String,
    packageDuration: String,
    themeImg:{filename:String,path:String,mimetype:String},
    availableVehicle:[{vehicleType:String,price:Number}],
    groupSize:Number,
    include:[String],
    exclude:[String],
    startLocation: String,
    advantureLocation:String,
    imgs:[{filename:String,path:String,mimetype:String}],
    discount:String,
    price: Number,
    overview: String,
    availableLanguage: [String],
    cancellationPolicy:String,
    highlight:String,
    endpoint:String,
    mapLink:String,
    unEligibility:{age:[Number],diseases:[String]},
    pickUpAndDrop: Boolean,
    pickUpOnly: Boolean,
    availableSlot:Number,
    dropOnly: Boolean,
    pickUpLocation: String,
    dropLocation: String,
    ageTypes: {
      adult: Boolean,
      children: Boolean,
      senior: Boolean,
    },
    age: {
      adult: String,
      children: String,
      senior: String,
    },

})
const advantureSchema = dbs.model('advanturePackages',advanturePackage)
module.exports = advantureSchema 