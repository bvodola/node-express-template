const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("cookie-session");

const env = require("./env");
const tokens = require("./auth/tokens");
const models = require("./models");
const crud = require("./crud");

const userRoutes = require("./user/routes");
const postRoutes = crud(models.Posts);

// ==============
// Initial Config
// ==============
const app = express();
const port = env.PORT || 2000;
const server = http.createServer(app);

// =====================
// Keep Heroku App awake
// =====================
setInterval(function () {
  try {
    http.get(env.BACKEND_URL);
  } catch (err) {
    console.error(err);
  }
}, 300000);

// ========================
// Redir from HTTP to HTTPS
// ========================
var redirectToHTTPS = require("express-http-to-https").redirectToHTTPS;
app.use(redirectToHTTPS([/localhost:(\d{4})/], [/\/insecure/], 301));

// ====
// CORS
// ====
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// ==========
// Middleware
// ==========
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/static", express.static("static/"));
app.use(session({ secret: env.PASSPORT_SECRET }));
app.use(passport.initialize());

// ====
// Auth
// ====
require("./auth/strategies")(passport);
app.use("/auth", require("./auth/routes")(passport));

// ===
// API
// ===
app.use("/users", tokens.validateMiddleware(), userRoutes);
app.use("/posts", postRoutes);

// ===================
// Production Settings
// ===================
if (app.settings.env === "production") {
  app.use(express.static("./client/build"));
  app.get("*", function (req, res) {
    res.sendFile("./client/build/index.html", { root: __dirname });
  });
}

// ======
// Server
// ======
try {
  server.listen(port, () => console.log(`Listening on port ${port}`));
  module.exports = app;
} catch (err) {
  console.error(err);
}
