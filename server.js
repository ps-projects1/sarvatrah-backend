const http = require('http')
const dotenv = require('dotenv')
const app = require('./app')


const port =  3232

const server = http.createServer(app)


server.listen(port,()=>{
    console.log(`server started ${port}`)
})