const express = require("express");
const { HolidayPackage } = require("../models/holidaysPackage");
const upload = require("../utils/file_upload/upload");
const { generalLimiter, uploadLimiter, limitIfFiles } = require("../middlewares/rateLimit");
const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const fileData = req.file;
    // Handle the uploaded file data
    res.status(200).json({ message: "File uploaded successfully", fileData });
  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error });
  }
});

module.exports = router;
const route = express.Router();
const app = express();
const moment = require("moment");
const {
  findAndUpdateItinerary,
} = require("../controllers/updatepackage.controller");

app.use("/data", express.static("public/data"));
const { hotelCollection } = require("../models/hotel");
const { vehicleCollection } = require("../models/vehicle");

route.get("/", generalLimiter,async (req, res, next) => {
  res.status(200).json({
    message: "holiday package homepage",
  });
});

route.post("/package-list",generalLimiter, async (req, res, next) => {
  let lowestVehiclePriceAllData = [];
  let hotelOccupancyRateAllData = [];
  let priceMarkupData = [];
  let hotelTotalPrice = 0;
  let query = { active: true };
  let date = new Date();
  let { page, page_size, sort_by_price, budget_range, tour_duration, theme } =
    req.body;
  let currentDate =
    date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
  try {
    if (budget_range?.gt > 0 && budget_range?.lt > 0) {
      query.priceMarkup = { $gte: budget_range.gt, $lte: budget_range.lt };
    }

    if (tour_duration?.lt > 0) {
      query["packageDuration.nights"] = {
        ...query["packageDuration.nights"],
        $lt: tour_duration?.lt ? tour_duration.lt : 0,
      };
    }

    if (tour_duration?.gt > 0) {
      query["packageDuration.nights"] = {
        ...query["packageDuration.nights"],
        $gt: tour_duration.gt ? tour_duration.gt : 0,
      };
    }

    if (theme) {
      query.theme = theme;
    }
    let sort = {};
    if (sort_by_price) {
      sort.priceMarkup = sort_by_price === "asc" ? 1 : -1;
    }
    console.log(query, sort); // Check if you get any results

    const packages = await packageCollection
      .find({})
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(page_size))
      .limit(parseInt(page_size));

    for (let packageData of packages) {
      priceMarkupData.push(packageData?.priceMarkup);
      // lowest vehicle price
      let lowestVehiclePrice = packageData?.availableVehicle?.reduce(
        (rate, vehicle) => (vehicle?.rate < rate ? vehicle?.rate : rate),
        packageData?.availableVehicle[0]?.rate
      );
      lowestVehiclePriceAllData.push(
        lowestVehiclePrice ? lowestVehiclePrice : 0
      );

      // hotel price calculation for ocupancy-1
      for (let itineraryData of packageData?.itinerary) {
        for (let dayItineraryData of itineraryData?.dayItinerary) {
          if (dayItineraryData?.type === "Hotel") {
            let hotelData = await hotelCollection.findById(
              dayItineraryData?.iti_id
            );
            for (let roomData of hotelData?.rooms) {
              if (roomData?.roomType === "Standard") {
                const [day, month, year] = currentDate?.split("-").map(Number);
                const startDate = new Date(roomData.duration[0]?.startDate);
                const endDate = new Date(roomData.duration[0]?.endDate);
                const dateToCheck = new Date(year, month - 1, day);
                if (dateToCheck >= startDate && dateToCheck <= endDate) {
                  hotelTotalPrice += roomData?.occupancyRates[1];
                }
              }
            }
          }
        }
      }
      hotelOccupancyRateAllData.push(hotelTotalPrice);
      hotelTotalPrice = 0;
    }

    let perPersonRate = [];
    for (let i = 0; i < hotelOccupancyRateAllData.length; i++) {
      let priceWithMarkup =
        ((hotelOccupancyRateAllData[i] + lowestVehiclePriceAllData[i]) *
          priceMarkupData[i]) /
        100;
      priceWithMarkup =
        priceWithMarkup +
        hotelOccupancyRateAllData[i] +
        lowestVehiclePriceAllData[i];

      // add markup rate
      perPersonRate.push(priceWithMarkup / 2);
    }
    // add vehicle lowest price
    // hotelTotalPrice += lowestVehiclePrice ? lowestVehiclePrice : 0;

    const updatedPackages = await Promise.all(
      packages.map(async (pkg) => {
        let totalTransferRate = 0;
        let totalHotelRate = 0;
        let totalActivitiesRate = 0;
        let noOfHotels = 0;
        let noOfVehicles = 0;
        let noOfActivities = 0;

        for (const itinerary of pkg.itinerary) {
          for (const dayItinerary of itinerary.dayItinerary) {
            if (dayItinerary.type === "Vehicle") {
              const vehicle = await vehicleCollection.findById(
                dayItinerary.iti_id
              );
              if (vehicle) {
                totalTransferRate += vehicle.rate;
                noOfVehicles++;
              }
            } else if (dayItinerary.type === "Hotel") {
              const hotel = await hotelCollection.findById(dayItinerary.iti_id);
              if (hotel) {
                noOfHotels++;
                const currentDate = moment();
                const room = hotel.rooms.find((room) => {
                  if (
                    room.duration[0] &&
                    room.duration[0].startDate &&
                    room.duration[0].endDate
                  ) {
                    const startDate = moment(
                      room.duration[0].startDate,
                      "YYYY-MM-DD"
                    );
                    const endDate = moment(
                      room.duration[0].endDate,
                      "YYYY-MM-DD"
                    );
                    return (
                      currentDate.isAfter(startDate) &&
                      currentDate.isBefore(endDate)
                    );
                  }
                  return false;
                });

                if (room) {
                  totalHotelRate += room.occupancyRates[0];
                }
              }
            } else if (dayItinerary.type === "Activity") {
              const activity = await activityCollection.findById(
                dayItinerary.iti_id
              );
              if (activity) {
                totalActivitiesRate += activity.price;
                noOfActivities++;
              }
            }
          }
        }

        return {
          ...pkg.toObject(),
          totalTransferRate,
          totalHotelRate,
          totalActivitiesRate,
          noOfHotels,
          noOfVehicles,
          noOfActivities,
        };
      })
    );

    for (let i = 0; i < updatedPackages.length; i++) {
      updatedPackages[i] = {
        ...updatedPackages[i],
        perPersonRate: perPersonRate[i],
      };
    }

    res.status(200).json(updatedPackages);
  } catch (error) {
    next(error);
  }
});

route.get("/packages",generalLimiter, async (req, res, next) => {
  const packageList = await packageCollection.find({ active: true });
  // Get Icon
  const getIcons = (args) => {
    const activity_lists = [];
    const activity_obj = { car: 1, hotel: 0, activity: 0 };
    for (let obj of args) {
      console.log("----------------------");
      for (let activity of obj.activities) {
        if (activity.objType === "hotel") {
          activity_obj.hotel = activity_obj.hotel + 1;
        } else if (activity.objType === "activity") {
          activity_obj.activity = activity_obj.activity + 1;
        }
      }
    }
    return activity_obj;
  };

  const filterList = packageList.map((data) => {
    getIcons(data.itinerary);
    return {
      duration: data.packageDuration,
      image: data.themeImg.path,
      packageName: data.packageName,
      startPlace: data.itinerary.map((iti) => iti.place),
      uses: getIcons(data.itinerary),
      id: data._id,
      price: data.price,
    };
  });

  res.status(200).json(filterList);
});

route.get("/package/gallery/:id",generalLimiter, async (req, res, next) => {
  const packageID = req.params.id;
  const packageInfo = await packageCollection.findById(packageID);

  console.log(packageInfo.imgs);
  res.status(200).json({ message: "working" });
});

route.post("/package/details/:id",generalLimiter, async (req, res, next) => {
  try {
    const date = new Date();
    const currentDate = `${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()}`;
    const packageID = req.params.id;

    const body_data = {
      travelStartDate: req.body?.date || currentDate,
      adult: req.body?.adult || 2,
      childWithBedPrice: req.body?.childWithBed || 0,
      childWithoutBedPrice: req.body?.childWithoutBed || 0,
      vehicleId: req.body?.vehicleId,
      ids: Array.isArray(req.body?.ids) ? req.body.ids : null, // Ensure `ids` is an array if provided
    };

    let hotelTotalPrice = 0;
    let availableVehicles = [];
    let availableHotels = [];

    const packageInfo = await packageCollection.findById(packageID);
    if (!packageInfo) {
      return res.status(404).json({ error: "Package not found" });
    }

    let modifiedItinerary = JSON.parse(JSON.stringify(packageInfo.itinerary));

    for (let itinerary of modifiedItinerary) {
      for (let dayItinerary of itinerary?.dayItinerary || []) {
        if (dayItinerary.type === "Vehicle") {
          const vehicle = await vehicleCollection.findById(
            dayItinerary?.iti_id
          );
          if (vehicle) {
            Object.assign(dayItinerary, {
              vehicleType: vehicle.vehicleType || null,
              brandName: vehicle.brandName || null,
              seatLimit: vehicle.seatLimit || null,
            });
          }
        }
      }
    }

    for (let itineraryData of packageInfo?.itinerary) {
      for (let dayItineraryData of itineraryData?.dayItinerary) {
        if (dayItineraryData?.type === "Hotel") {
          let hotelData = await hotelCollection.findById(
            dayItineraryData?.iti_id
          );
          if (!hotelData) continue;

          // Fetch All Hotels in the Same City
          let hotelList = await hotelCollection.find({ city: hotelData?.city });
          availableHotels.push({ city: hotelData?.city, hotels: hotelList });

          for (let roomData of hotelData?.rooms || []) {
            if (roomData.roomType === "Standard") {
              const [day, month, year] = body_data?.travelStartDate
                .split("-")
                .map(Number);
              const dateToCheck = new Date(year, month - 1, day);
              const startDate = new Date(roomData.duration[0]?.startDate);
              const endDate = new Date(roomData.duration[0]?.endDate);

              if (dateToCheck >= startDate && dateToCheck <= endDate) {
                hotelTotalPrice +=
                  roomData.occupancyRates?.[body_data.adult - 1] || 0;
                hotelTotalPrice += roomData?.child?.childWithBedPrice || 0;
                hotelTotalPrice += roomData?.child?.childWithoutBedPrice || 0;
              }
            }
          }
        }
      }
    }

    if (body_data.ids) {
      for (let { hotelId } of body_data.ids) {
        if (hotelId) {
          const selectedHotel = await hotelCollection.findById(hotelId);
          if (selectedHotel) {
            for (let roomData of selectedHotel.rooms || []) {
              if (roomData.roomType === "Standard") {
                hotelTotalPrice +=
                  roomData.occupancyRates?.[body_data.adult - 1] || 0;
                hotelTotalPrice += roomData?.child?.childWithBedPrice || 0;
                hotelTotalPrice += roomData?.child?.childWithoutBedPrice || 0;
              }
            }
          }
        }
      }
    }

    availableVehicles =
      packageInfo?.availableVehicle?.sort((a, b) => a?.rate - b?.rate) || [];

    let lowestVehiclePrice = availableVehicles.length
      ? availableVehicles[0]?.rate
      : 0;

    if (!body_data?.vehicleId) {
      hotelTotalPrice += lowestVehiclePrice;
    } else {
      const selectedVehicle = packageInfo?.availableVehicle.find(
        (v) => v?._id == body_data?.vehicleId
      );
      hotelTotalPrice += selectedVehicle?.rate || 0;
    }

    // 🟢 Apply Price Markup
    hotelTotalPrice +=
      (hotelTotalPrice * (packageInfo?.priceMarkup || 1)) / 100;

    // 🟢 Prepare Response
    const response = {
      packageDuration: packageInfo.packageDuration,
      _id: packageInfo._id,
      packageName: packageInfo.packageName,
      images: packageInfo?.images,
      roomLimit: packageInfo.roomLimit,
      include: packageInfo.include,
      itinerary: modifiedItinerary,
      exclude: packageInfo.exclude,
      price: packageInfo.price,
      destinationCity: packageInfo.destinationCity,
      noOfActivities: packageInfo.noOfActivities,
      noOfHotels: packageInfo.noOfHotels,
      noOfTransfers: packageInfo.noOfTransfers,
      totalHotelRate: packageInfo.totalHotelRate,
      totalTransferRate: lowestVehiclePrice,
      hotelTotalPrice,
      inflatedPrice: packageInfo?.inflatedPercentage,
      priceMarkup: packageInfo?.priceMarkup || 1,
      vehicleListOptions: availableVehicles,
      availableHotels,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in /package/details route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

route.get("/package/iti/:id",generalLimiter, async (req, res, next) => {
  const packageID = req.params.id;
  let sortedCar;
  const packageInfo = await packageCollection.findById(packageID);
  const carList = [];
  let guestLists;
  if (!req.cookies.room_guest) {
    guestLists = [{ adult: 2, cb: 0, cwb: 0 }];
  } else {
    guestLists = JSON.parse(req.cookies.room_guest);
  }
  const guests = guestLists.reduce(
    (acc, current) => {
      acc.adult += current.adult;
      acc.adult += current.cb;
      acc.adult += current.cwb;
      return acc;
    },
    { adult: 0 }
  );
  for (let car of packageInfo.availableVehicle) {
    const carAvailable = await vehicleCollection.find({
      seatLimit: car.seatLimit,
      vehicleType: car.vehicleType,
      vehicleCategory: car.vehicleCategory,
    });
    if (carAvailable[0].inventry > 0) {
      const calcSeat = guests.adult / parseInt(car.seatLimit);
      const newCarObj = {
        vehicleCategory: car.vehicleCategory,
        activityID: carAvailable[0]._id,
        vehicleType: car.vehicleType,
        price: car.price,
        seatLimit: car.seatLimit,
        quantity: Math.ceil(calcSeat),
        totalPrice: parseInt(car.price) * Math.ceil(calcSeat),
      };
      carList.push(newCarObj);
    } else {
      continue;
    }
  }
  sortedCar = [
    ...carList.sort((a, b) => a.totalPrice - b.totalPrice).slice(0, 3),
    ...carList.sort((a, b) => b.totalPrice - a.totalPrice).slice(0, 1),
  ];
  sortedCar = sortedCar.sort((a, b) => a.quantity - b.quantity).slice(0, 4);

  const result = {
    itinerary: await Promise.all(
      packageInfo.itinerary.map(async (data) => {
        return {
          title: data.title,
          dayCount: data.dayCount,
          place: data.place,
          activities: await Promise.all(
            data.activities.map(async (act) => {
              if (act.objType === "car") {
                let carResult = {
                  ...sortedCar[0],
                  ...{ sequence: act.sequence, objType: act.objType },
                };
                return carResult;
              } else if (act.objType === "hotel") {
                const hotelAvailable = await hotelCollection.find({
                  city: data.place,
                });

                const hotelList = hotelAvailable.sort(
                  (a, b) => a.rooms[0].occupancy1 - b.rooms[0].occupancy1
                );
                return {
                  sequence: act.sequence,
                  objType: act.objType,
                  activityID: hotelList[0]._id,
                };
              } else {
                return act;
              }
            })
          ),
        };
      })
    ),
  };
  res.status(200).json(result);
});

route.get("/package/iti/vehicle/update/:id",generalLimiter, async (req, res, next) => {
  const packageID = req.params.id;
  let sortedCar;
  const packageInfo = await packageCollection.findById(packageID);
  const carList = [];
  let guestLists;
  if (!req.cookies.room_guest) {
    guestLists = [{ adult: 2, cb: 0, cwb: 0 }];
  } else {
    guestLists = JSON.parse(req.cookies.room_guest);
  }
  const guests = guestLists.reduce(
    (acc, current) => {
      acc.adult += current.adult;
      acc.adult += current.cb;
      acc.adult += current.cwb;
      return acc;
    },
    { adult: 0 }
  );

  for (let car of packageInfo.availableVehicle) {
    const carAvailable = await vehicleCollection.find({
      seatLimit: car.seatLimit,
      vehicleType: car.vehicleType,
      vehicleCategory: car.vehicleCategory,
      // city: "Cochin",
    });
    if (carAvailable[0].inventry > 0) {
      const calcSeat = guests.adult / parseInt(car.seatLimit);
      const newCarObj = {
        vehicleCategory: car.vehicleCategory,
        activityID: carAvailable[0]._id,
        vehicleType: car.vehicleType,
        price: car.price,
        seatLimit: car.seatLimit,
        quantity: Math.ceil(calcSeat),
        totalPrice: parseInt(car.price) * Math.ceil(calcSeat),
        // img: carAvailable[0].img.path
      };
      carList.push(newCarObj);
    } else {
      continue;
    }
  }
  sortedCar = [
    ...carList.sort((a, b) => a.totalPrice - b.totalPrice).slice(0, 3),
    ...carList.sort((a, b) => b.totalPrice - a.totalPrice).slice(0, 1),
  ];
  sortedCar = sortedCar.sort((a, b) => a.quantity - b.quantity).slice(0, 4);

  res.status(200).json(sortedCar);
});

route.get("/package/iti/hotel/update/:id",generalLimiter, async (req, res, next) => {
  try {
    const packageID = req.params.id;
    const packageInfo = await packageCollection.findById(packageID);

    if (!packageInfo) {
      return res.status(404).json({ error: "Package not found" });
    }

    let guestLists;
    if (!req.cookies.room_guest) {
      guestLists = [{ adult: 2, cb: 0, cwb: 0 }];
    } else {
      guestLists = JSON.parse(req.cookies.room_guest);
    }

    let hotelList = [];
    let hotelResult = [];

    for (let data of packageInfo.itinerary) {
      for (let act of data.dayItinerary) {
        if (act.type === "Hotel") {
          const hotel = await hotelCollection.findById(act.iti_id);
          if (hotel) {
            const hotelAvailable = await hotelCollection.find({
              city: hotel.city,
            });
            hotelList = hotelAvailable.sort(
              (a, b) =>
                a.rooms[0].occupancyRates[0] - b.rooms[0].occupancyRates[0]
            );
          }
        }
      }
    }

    const currentDate = new Date();

    for (let hotel of hotelList) {
      let bashPrice;
      hotelResult.push({
        _id: hotel._id,
        objectType: hotel.objectType,
        hotelType: hotel.hotelType,
        hotelName: hotel.hotelName,
        address: hotel.address,
        state: hotel.state,
        city: hotel.city,
        pincode: hotel.pincode,
        phoneNumber: hotel.phoneNumber,
        email: hotel.email,
        contactPerson: hotel.contactPerson,
        imgs: hotel.imgs.map((img) => ({
          filename: img.filename,
          path: img.path,
          mimetype: img.mimetype,
        })),
        rooms: hotel.rooms
          .filter((vac) =>
            vac.duration.some(
              (dur) =>
                currentDate >= new Date(dur.startDate) &&
                currentDate <= new Date(dur.endDate)
            )
          )
          .map((vac) => {
            if (vac.roomType === "Standard") {
              bashPrice = vac.occupancyRates[1];
            }
            let travellerPrice = 0;
            for (let traveller of guestLists) {
              if (traveller.adult === 1) {
                travellerPrice += vac.occupancyRates[0];
              }
              if (traveller.adult === 2) {
                travellerPrice += vac.occupancyRates[1];
              }
              if (traveller.adult === 3) {
                travellerPrice += vac.occupancyRates[2];
              }
              if (traveller.cb) {
                travellerPrice += vac.child.childWithBedPrice * traveller.cb;
              }
              if (traveller.cwb) {
                travellerPrice +=
                  vac.child.childWithoutBedPrice * traveller.cwb;
              }
            }

            return {
              roomType: vac.roomType,
              child: {
                childWithBedPrice: vac.child.childWithBedPrice,
                childWithoutBedPrice: vac.child.childWithoutBedPrice,
              },
              occupancyRates: vac.occupancyRates,
              amenities: vac.amenities,
              duration: vac.duration.map((dur) => ({
                startDate: dur.startDate,
                endDate: dur.endDate,
                _id: dur._id,
              })),
              totalPrice: travellerPrice,
              payable: travellerPrice - bashPrice,
              _id: vac._id,
            };
          }),
        __v: hotel.__v,
      });
    }

    res.status(200).json(hotelResult);
  } catch (error) {
    next(error);
  }
});

route.post("/package", upload.array("files", 10),limitIfFiles(uploadLimiter), async (req, res, next) => {
  try {
    const packageName = req.body.packageName;
    const packageDuration = JSON.parse(req.body.packageDuration);
    const availableVehicle = JSON.parse(req.body.availableVehicle);
    const roomLimit = req.body.roomLimit;
    const include = req.body.include;
    const exclude = req.body.exclude;
    const price = req.body.price;

    const themeImg = {
      filename: req.files[0].filename,
      path:
        "http://127.0.0.1:3232/" +
        path.posix.relative("public", req.files[0].path).replace(/\\/g, "/"),
      mimetype: req.files[0].mimetype,
    };

    let subFile = req.files.slice(1);
    const imgs = subFile.map((file) => ({
      filename: file.filename,
      path:
        "http://127.0.0.1:3232/" +
        path.posix.relative("public", file.path).replace(/\\/g, "/"),
      mimetype: file.mimetype,
    }));

    let packageObj = await packageCollection.create({
      packageName: packageName,
      packageDuration: packageDuration,
      availableVehicle: availableVehicle,
      roomLimit: roomLimit,
      include: include,
      exclude: exclude,
      themeImg: themeImg,
      imgs: imgs,
      price: price,
    });

    return res
      .status(200)
      .json({ Status: "Package Created", data: packageObj });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Status: "Error creating package", error: error.message });
  }
});

route.post("/package/itinerary",generalLimiter,async (req, res, next) => {
  const dayCount = req.body.dayCount;
  const packageID = req.body.packageID;
  const place = req.body.place;
  const include = req.body.include;
  const exclude = req.body.exclude;
  const title = req.body.title;
  const itineraryInfo = req.cookies.itineraryData;

  const decryptActivityInfo = JSON.parse(itineraryInfo);
  const addItinerary = {
    dayCount: dayCount,
    place: place,
    include: include,
    exclude: exclude,
    title: title,
    activities: decryptActivityInfo.activities,
  };
  const packageInfo = await packageCollection.findById(packageID);
  if (!packageInfo) {
    return res.status(404).json({ error: "Package not found" });
  }

  packageInfo.itinerary.push(addItinerary);
  const updatedPackageInfo = await packageInfo.save();
  res.status(200).json(updatedPackageInfo);
});



const multer = require("multer");

// Simplified storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    // Use a more reliable way to determine destination
    if (req.baseUrl === "/holidays") {
      callback(null, "public/data/holidays");
    } else {
      callback(null, "public/data/uploads");
    }
  },
  filename: function (req, file, callback) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = file.originalname.split(".").pop();
    const newFilename = `holiday-${uniqueSuffix}.${fileExtension}`;
    callback(null, newFilename);
  },
});

const uploads = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Updated route handler
route.post("/createPackage", uploads.fields([
  { name: 'themeImage', maxCount: 1 },
  { name: 'files', maxCount: 10 }
]), async (req, res) => {
  try {
    console.log("Files received:", req.files);
    console.log("Body received:", req.body);

    const {
      packageName,
      selectType,
      uniqueId,
      packageType,
      paymentDueDays,
      destinationCity,
      highlights,
      partialPayment,
      recommendedPackage,
      cancellationPolicyType,
      roomLimit,
      createPilgrimage,
      displayHomepage,
      status,
      include,
      exclude,
      priceMarkup,
      partialPaymentPercentage,
      startCity,
      days,
      nights,
      refundablePercentage,
      refundableDays,
      inflatedPercentage,
      active
    } = req.body;

    // Validate required fields
    if (!packageName || !uniqueId) {
      return res.status(400).json({
        success: false,
        message: "Package name and unique ID are required"
      });
    }

    // File handling
    const themeFile = req.files?.themeImage?.[0];
    const additionalFiles = req.files?.files || [];

    if (!themeFile) {
      return res.status(400).json({
        success: false,
        message: "Theme image is required"
      });
    }

    const convertPath = (path) => path.replace(/\\/g, "/").replace("public/", "");

    const themeImg = {
      filename: themeFile.filename,
      path: `http://127.0.0.1:3232/${convertPath(themeFile.path)}`,
      mimetype: themeFile.mimetype,
    };

    const images = additionalFiles.map((file) => ({
      filename: file.filename,
      path: `http://127.0.0.1:3232/${convertPath(file.path)}`,
      mimetype: file.mimetype,
    }));

    // Parse JSON fields with error handling
    let itinerary = [];
    let destinationCities = [];
    let availableVehicles = [];

    try {
      itinerary = JSON.parse(req.body.itinerary || "[]");
      destinationCities = JSON.parse(destinationCity || "[]");
      availableVehicles = JSON.parse(req.body.availableVehicle || "[]");
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return res.status(400).json({
        success: false,
        message: "Invalid JSON data in itinerary or destinationCity"
      });
    }

    // Create package object
    const packageObj = {
      packageName,
      packageDuration: {
        days: parseInt(days) || 1,
        nights: parseInt(nights) || 0
      },
      themeImg,
      selectType,
      uniqueId,
      packageType,
      destinationCity: destinationCities,
      highlights,
      status: status === "true",
      createPilgrimage: createPilgrimage === "true",
      displayHomepage: displayHomepage === "true",
      partialPayment: partialPayment === "true",
      recommendedPackage: recommendedPackage === "true",
      paymentDueDays: parseInt(paymentDueDays) || 0,
      partialPaymentPercentage: parseFloat(partialPaymentPercentage) || 0,
      cancellationPolicyType,
      roomLimit: parseInt(roomLimit) || 1,
      include,
      exclude,
      priceMarkup: parseFloat(priceMarkup) || 0,
      inflatedPercentage: parseFloat(inflatedPercentage) || 0,
      refundablePercentage: parseFloat(refundablePercentage) || 0,
      refundableDays: parseInt(refundableDays) || 0,
      itinerary,
      images,
      availableVehicle: availableVehicles,
      active: active !== "false",
      startCity,
      inventory: 0
    };
    console.log(packageObj)

    const createdPackage = await HolidayPackage.create(packageObj);
    console.log(createdPackage)

    return res.status(200).json({
      success: true,
      message: "Package Created Successfully",
      data: createdPackage
    });

  } catch (err) {
    console.error("Error creating package:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

route.put("/updatePackage",
  uploads.fields([
    { name: 'themeImage', maxCount: 1 },
    { name: 'files', maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      console.log("UPDATE BODY:", req.body);
      console.log("UPDATE FILES:", req.files);

      const {
        _id,
        packageName,
        selectType,
        uniqueId,
        packageType,
        paymentDueDays,
        destinationCity,
        highlights,
        partialPayment,
        recommendedPackage,
        cancellationPolicyType,
        roomLimit,
        createPilgrimage,
        displayHomepage,
        status,
        include,
        exclude,
        priceMarkup,
        partialPaymentPercentage,
        startCity,
        days,
        nights,
        refundablePercentage,
        refundableDays,
        inflatedPercentage,
        active
      } = req.body;

      if (!_id) {
        return res.status(400).json({
          success: false,
          message: "_id is required for update"
        });
      }

      const packageObj = await HolidayPackage.findById(_id);
      if (!packageObj) {
        return res.status(404).json({
          success: false,
          message: "Package not found"
        });
      }

      // Handle uploaded files
      const themeFile = req.files?.themeImage?.[0];
      const additionalFiles = req.files?.files || [];

      const convertPath = (path) =>
        path.replace(/\\/g, "/").replace("public/", "");

      // Update theme image ONLY if new file uploaded
      if (themeFile) {
        packageObj.themeImg = {
          filename: themeFile.filename,
          path: `http://127.0.0.1:3232/${convertPath(themeFile.path)}`,
          mimetype: themeFile.mimetype,
        };
      }

      // Add any newly uploaded additional images
      const newImages = additionalFiles.map((file) => ({
        filename: file.filename,
        path: `http://127.0.0.1:3232/${convertPath(file.path)}`,
        mimetype: file.mimetype,
      }));

      if (newImages.length > 0) {
        packageObj.images = [...packageObj.images, ...newImages];
      }

      // Parse JSON fields
      let itinerary = [];
      let destinationCities = [];
      let availableVehicles = [];

      try {
        itinerary = JSON.parse(req.body.itinerary || "[]");
        destinationCities = JSON.parse(destinationCity || "[]");
        availableVehicles = JSON.parse(req.body.availableVehicle || "[]");
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON format in fields"
        });
      }

      // Update fields
      packageObj.packageName = packageName || packageObj.packageName;
      packageObj.selectType = selectType || packageObj.selectType;
      packageObj.uniqueId = uniqueId || packageObj.uniqueId;
      packageObj.packageType = packageType || packageObj.packageType;
      packageObj.destinationCity = destinationCities.length ? destinationCities : packageObj.destinationCity;
      packageObj.highlights = highlights || packageObj.highlights;
      packageObj.status = status === "true";
      packageObj.createPilgrimage = createPilgrimage === "true";
      packageObj.displayHomepage = displayHomepage === "true";
      packageObj.recommendedPackage = recommendedPackage === "true";
      packageObj.partialPayment = partialPayment === "true";
      packageObj.paymentDueDays = parseInt(paymentDueDays) || 0;
      packageObj.partialPaymentPercentage = parseFloat(partialPaymentPercentage) || 0;
      packageObj.cancellationPolicyType = cancellationPolicyType || packageObj.cancellationPolicyType;
      packageObj.roomLimit = parseInt(roomLimit) || packageObj.roomLimit;
      packageObj.include = include || packageObj.include;
      packageObj.exclude = exclude || packageObj.exclude;
      packageObj.priceMarkup = parseFloat(priceMarkup) || packageObj.priceMarkup;
      packageObj.inflatedPercentage = parseFloat(inflatedPercentage) || packageObj.inflatedPercentage;
      packageObj.refundablePercentage = parseFloat(refundablePercentage) || packageObj.refundablePercentage;
      packageObj.refundableDays = parseInt(refundableDays) || packageObj.refundableDays;
      packageObj.startCity = startCity || packageObj.startCity;
      packageObj.availableVehicle = availableVehicles;
      packageObj.active = active !== "false";

      // Update duration
      packageObj.packageDuration = {
        days: parseInt(days) || packageObj.packageDuration.days,
        nights: parseInt(nights) || packageObj.packageDuration.nights
      };

      // Update itinerary
      if (Array.isArray(itinerary) && itinerary.length > 0) {
        packageObj.itinerary = itinerary;
      }

      const updated = await packageObj.save();

      return res.status(200).json({
        success: true,
        message: "Package updated successfully",
        data: updated
      });

    } catch (err) {
      console.error("UPDATE ERROR:", err);
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
);


route.put(
  "/package/update/vehicle/:packageId/:vehicleId",
  async (req, res, next) => {
    try {
      const { packageId, vehicleId } = req.params;
      const vehicle = await vehicleCollection.findById(vehicleId);

      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      const updateFunction = async (itinerary) => {
        for (let day of itinerary) {
          for (let activity of day.dayItinerary) {
            if (activity.type === "Vehicle" && activity.iti_id === vehicleId) {
              activity.title = vehicle.vehicleType;
              activity.details = vehicle.details;
              activity.description = vehicle.description;
              activity.duration = vehicle.duration;
            }
          }
        }
        return itinerary;
      };

      const updatedPackage = await findAndUpdateItinerary(
        packageId,
        updateFunction
      );

      res.status(200).json(updatedPackage);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = route;
