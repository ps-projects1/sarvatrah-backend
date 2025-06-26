const express = require("express");
// const packageCollection = require('../models/holidaysPackage');
const upload = require("../utils/file_upload/upload");
const route = express.Router();
const jwt = require("jsonwebtoken");
const activityCollection = require("../models/activityPackage");

route.get("/", async (req, res, next) => {
  const activityLists = await activityCollection.find({});
  const response = activityLists.map((data) => {
    return {
      packageName: data.packageName,
      packageDuration: data.packageDuration,
      startLocation: data.startLocation,
      activityLocation: data.activityLocation,
      price: data.price,
      themeImg: data.themeImg.path,
      _id: data._id,
    };
  });
  res.status(200).json({ data: response });
});

// route.post('/',upload.fields([{name:'file',maxCount:1}]),async(req,res,next) =>{

//     const packageName= req.query.packageName
//     const packageDuration= req.query.packageDuration
//     const availableVehicle=JSON.parse(req.query.availableVehicle)
//     const groupSize=req.query.groupSize
//     const include=JSON.parse(req.query.include)
//     const exclude=JSON.parse(req.query.exclude)
//     const startLocation= req.query.startLocation
//     const activityLocation=req.query.activityLocation
//     const discount=req.query.discount
//     const price= req.query.price
//     const overview= req.query.overview
//     const availableLanguage= JSON.parse(req.query.availableLanguage)
//     const cancellationPolicy=req.query.cancellationPolicy
//     const hightlight=req.query.hightlight
//     const mapLink=req.query.mapLink
//     const unEligibility=JSON.parse(req.query.unEligibility)
//     const availableSlot=req.query.availableSlot
//     // console.log("file.path------>",req.files.file[0].path);
//     const themeImg ={
//         filename:req.files.file[0].filename,
//         // path:'http://127.0.0.1:3232/'+req.files.file[0].path.replace('public/',''),
//         path:'http://127.0.0.1:3232/' + req.files.file[0].path.replace('public\\', '').replace(/\\/g, '/').replace(/\//g, '/'),
//         mimetype:req.files.file[0].mimetype}
//     // console.log("themeImg------------->",themeImg);
//     // const imgs = req.files.subfile.map(file =>{
//     //     return {
//     //         filename:file.filename,
//     //         path:'http://127.0.0.1:3232/'+file.path.replace('public\\', '').replace(/\\/g, '/').replace(/\//g, '/'),
//     //         mimetype:file.mimetype}
//     // })
//     await activityCollection.create({
//         packageName:packageName,
//         packageDuration:packageDuration,
//         themeImg:{...themeImg,path: themeImg.path.replace(/\\/g, '/')},
//         availableVehicle:availableVehicle,
//         groupSize:groupSize,
//         include:include,
//         exclude:exclude,
//         startLocation:startLocation,
//         activityLocation:activityLocation,
//         // imgs:imgs,
//         discount:discount,
//         price:price,
//         overview:overview,
//         availableLanguage:availableLanguage,
//         cancellationPolicy:cancellationPolicy,
//         hightlight:hightlight,
//         mapLink:mapLink,
//         unEligibility:unEligibility,
//         availableSlo:availableSlot
//     })
//     // console.log([
//     //     packageName,
//     //     packageDuration,
//     //     themeImg,
//     //     availableVehicle,
//     //     groupSize,
//     //     include,
//     //     exclude,
//     //     startLocation,
//     //     activityLocation,
//     //     imgs,
//     //     discount,
//     //     price,
//     //     overview,
//     //     availableLanguage,
//     //     cancellationPolicy,
//     //     hightlight,
//     //     mapLink,
//     //     unEligibility,
//     //     availableSlot

//     // ])
//     res.status(201).json({status:"created"})
// })

route.post(
  "/",
  upload.fields([{ name: "file", maxCount: 1 }]),
  async (req, res, next) => {
    try {
      // Extracting data from query parameters
      const {
        packageName,
        packageDuration,
        availableVehicle,
        groupSize,
        include,
        exclude,
        startLocation,
        activityLocation,
        discount,
        price,
        overview,
        availableLanguage,
        cancellationPolicy,
        highlight,
        mapLink,
        unEligibility,
        availableSlot,
        pickUpAndDrop,
        pickUpOnly,
        dropOnly,
        pickUpLocation,
        dropLocation,
        ageTypes,
        age,
      } = req.query;

      // Extracting file information
      const themeImg = {
        filename: req.files.file[0].filename,
        path:
          "http://127.0.0.1:3232/" +
          req.files.file[0].path
            .replace("public\\", "")
            .replace(/\\/g, "/")
            .replace(/\//g, "/"),
        mimetype: req.files.file[0].mimetype,
      };

      // Creating activity
      await activityCollection.create({
        packageName,
        packageDuration,
        themeImg: { ...themeImg, path: themeImg.path.replace(/\\/g, "/") },
        availableVehicle: JSON.parse(availableVehicle),
        groupSize,
        include: JSON.parse(include),
        exclude: JSON.parse(exclude),
        startLocation,
        activityLocation,
        discount,
        price,
        overview,
        availableLanguage: JSON.parse(availableLanguage),
        cancellationPolicy,
        highlight,
        mapLink,
        unEligibility: JSON.parse(unEligibility),
        availableSlot,
        pickUpAndDrop: Boolean(pickUpAndDrop),
        pickUpOnly: Boolean(pickUpOnly),
        dropOnly: Boolean(dropOnly),
        pickUpLocation,
        dropLocation,
        // ageTypes: {
        //     adult: Boolean(ageTypes.adult),
        //     children: Boolean(ageTypes.children),
        //     senior: Boolean(ageTypes.senior),
        // },
        age,
      });

      res.status(201).json({ status: "created" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

route.get("/:id", async (req, res, next) => {
  const id = req.params.id;
  const activity = await activityCollection.findById(id);
  res.status(200).json({ data: activity });
});

module.exports = route;
