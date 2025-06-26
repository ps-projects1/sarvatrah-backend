const dbs = require('mongoose')

itinerarySchema = dbs.Schema({
    title:String,
    dayCount: Number,
    place:String,
    include:String,
    exclude:String,
    activities:[{sequence:Number,activityID:String,objType:String}]

})

const pilgriPackage = dbs.Schema({
    objectType:{type:String,default:'pilgri'},
    packageName: String,
    packageDuration:{days:Number,night:Number},
    themeImg:{filename:String,path:String,mimetype:String},
    availableVehicle:[{vehicleType:String,price:Number}],
    roomLimit:Number,
    include:String,
    exclude:String,
    itinerary:[itinerarySchema],
    imgs:[{filename:String,path:String,mimetype:String}]

})
const pilgriPackageModel = dbs.model('pilgriPackage',pilgriPackage)
module.exports = pilgriPackageModel