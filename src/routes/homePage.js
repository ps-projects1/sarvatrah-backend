// const express = require('express');
// const route = express.Router()
// const fileUpload = require('../utils/file_upload/upload')
// const { v4: uuidv4 } = require('uuid');
// const multer = require('multer')
// const homeContent = require('../models/home')

// route.get("/",(req,res,next) =>{
//     res.status(200).json(
//         {
//             message:'user homepage'
//         }
//     )
// });


// route.post("/search/background", (req,res,next) =>{
//     const generateName = uuidv4()
    
//     const upload =  fileUpload(generateName,'images')

//     upload.single('file')(req,res,(error) =>{

//         if (error instanceof multer.MulterError) {
//             return res.status(400).json({ message: error.message });
//           } 
//         else if (error) {
//             return res.status(500).json({ message: 'An error occurred.' });
//           }
//     const fileName = (req.file.filename).split('.')
//     const homes = homeContent.find({name:'4536f1c6-eaa6-4cf6-b3ce-4f3a1ef524bd'})
//     console.log(homes.name)

    

    
//         res.status(200).json({ message: 'File uploaded successfully.' });
        
//     })

// });

// route.get("/:id",(req,res,next) =>{
//     const key = req.query.key;
//     const id = req.params.id;
//     res.status(200).json(
//         {
//             message:`user id ${id}`
//         }
//     )

// });

// module.exports = route