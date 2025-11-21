const dbs = require('mongoose')

itinerarySchema = dbs.Schema({
    title:String,
    dayCount: Number,
    place:String,
    include:String,
    exclude:String,
    activities:[{sequence:Number,activityID:String,objType:String}]

})

const holidayPackage = dbs.Schema({
    objectType:{type:String,default:'holidays'},
    packageName: String,
    packageDuration:{days:Number,night:Number},
    themeImg:{filename:String,path:String,mimetype:String},
    availableVehicle:[{vehicleType:String,price:Number,vehicleCategory:String,seatLimit:Number}],
    roomLimit:Number,
    include:String,
    exclude:String,
    itinerary:[itinerarySchema],
    imgs:[{filename:String,path:String,mimetype:String}],
    price:Number,
    active: Boolean,
    inventry:Number

})

const holidayPackageModel = dbs.model('holidayPackage',holidayPackage)
module.exports = holidayPackageModel