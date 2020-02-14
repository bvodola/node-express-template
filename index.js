const express = require("express");
const http = require("http");
const https = require("http");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("cookie-session");
const apolloServer = require("./apollo");
const env = require("./env");
const hubspotRoutes = require("./hubspot/routes");

// ==============
// Initial Config
// ==============
const app = express();
const port = env.PORT || 3000;
const server = http.createServer(app);
apolloServer.applyMiddleware({ app });
app.use("/graphql", () => {});

// =====================
// Keep Heroku App awake
// =====================
setInterval(function() {
  https.get(env.BACKEND_URL);
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
  const allowedOrigins = [
    // "chrome-extension://nallaonplkppkoblffghfkmebdbjlbji"
    "chrome-extension://mkpomcaaododlneedilihiedcpgknikb"
  ];

  allowedOrigins.forEach(origin => {
    res.header("Access-Control-Allow-Origin", origin);
  });

  if (app.settings.env !== "production")
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
app.use("/hubspot", hubspotRoutes);

// ===================
// Production Settings
// ===================
if (app.settings.env === "production") {
  app.use(express.static("./client/build"));
  app.get("*", function(req, res) {
    res.sendFile("./client/build/index.html", { root: __dirname });
  });
}

// ======
// Server
// ======
server.listen(port, () =>
  console.log(`Listening on port ${port}, ${apolloServer.graphqlPath}`)
);
module.exports = app;
