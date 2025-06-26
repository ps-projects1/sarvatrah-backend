const dbs = require('mongoose')

const activity = dbs.Schema({
    objectType:{type:String,default:"activity"},
    packageType: {type:String,required:true},
    activityName: {type:String,required:true},
    activityPlace: {type:String,required:true},
    targetPlaces:[String],
    duration:Number,
    placeCover:Number,
    price:Number,
    img:{filename:String,path:String,mimetype:String},
    description:String

})

activitySchema = dbs.model('activity',activity)
module.exports = activitySchema