const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const listEndpoints = require("express-list-endpoints");

const connectDB = require("./src/config/dbConfig");

// Routes
const footerRoutes = require("./src/routes/footer");
const inventriesRouts = require("./src/routes/inventry");
const holidayRouts = require("./src/routes/holidays");
const actRouts = require("./src/routes/act");
const pilgriRouts = require("./src/routes/pilgri");
const activityRouts = require("./src/routes/activity");
const advantureRouts = require("./src/routes/advanture");
const processRouts = require("./src/routes/process");
const experienceRoute = require("./src/routes/experience");
const adminRoutes = require("./src/routes/adminRoutes");
const user = require("./src/routes/user");
const booking = require("./src/routes/booking");
const hotelRoutes = require("./src/routes/hotel.route");
const vehicleRoutes = require("./src/routes/vehicle.route");
const stateRoutes = require("./src/routes/state.route");
const cityRoutes = require("./src/routes/city.route");
const holidayRoutes = require("./src/routes/holidayPackage.route");

dotenv.config();
const app = express();
const secretKey = process.env.SECRET_KEY;

// Connect to database
connectDB();

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3232",
  "http://localhost:5173",
  "https://v1.sarvatrah.com",
  "http://127.0.0.1:5173",
  "https://sarvatrah-frontend.vercel.app",
  "https://sarvatrah-admin.vercel.app",
  "https://sarvatrah-admin-k9qze72es-sarvatrahs-projects.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    exposedHeaders: "*",
    optionsSuccessStatus: 200,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "*",
  })
);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(logger("dev"));
app.use(express.static("public"));

// Routes
app.use("/inventries", inventriesRouts);
app.use("/holidays", holidayRouts);
app.use("/activity", actRouts);
app.use("/pilgri", pilgriRouts);
app.use("/activities", activityRouts);
app.use("/advanture", advantureRouts);
app.use("/process", processRouts);
app.use("/experience", experienceRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/v1", user);
app.use("/booking", booking);
app.use("/hotel", hotelRoutes);
app.use("/vehicle", vehicleRoutes);
app.use("/state", stateRoutes);
app.use("/city", cityRoutes);
app.use("/holiday", holidayRoutes);

app.use("/api/footer", footerRoutes);

// Test route
app.post("/submit", (req, res) => {
  const formData = req.body;
  return res.json(formData);
});

// Token generation
app.post("/token/:type", (req, res) => {
  const payload = req.body;
  const type = req.params.type;
  const cookieName = type === "room" ? "roomInfo" : "itineraryData";

  jwt.sign(payload, secretKey, (err, token) => {
    if (err) {
      res.status(500).json({ error: "Failed to generate token" });
    } else {
      res.setHeader(
        "Set-Cookie",
        cookie.serialize(cookieName, token, {
          expires: new Date(Date.now() + 3600 * 1000), // 1 hour
          path: "/",
        })
      );
      res.status(200).json({ token });
    }
  });
});

// 404 handler
app.use((req, res, next) => {
  const error = new Error("Not Found 404");
  error.status = 404;
  next(error);
});


app.get("/test",(req, res)=>{

  res.json({test:"Working"})
})

// Global error handler
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({ message: { error: error.message } });
});

console.log('\n📍 ===== ALL API ENDPOINTS =====\n');
const endpoints = listEndpoints(app);
endpoints.forEach(endpoint => {
  const methods = endpoint.methods.join(', ');
  console.log(`[${methods}]\t\t${endpoint.path}`);
});
console.log('\n================================\n');

module.exports = app;
