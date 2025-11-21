const dbs = require('mongoose')

const samplesSchema = new dbs.Schema({
    name: String,
    age:Number
})

const homeContent =  dbs.model("homeS",samplesSchema)
module.exports = homeContent