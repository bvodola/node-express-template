var express = require("express");
var { registerMiddleware, validateMiddleware } = require("./index");
var router = express.Router();
var tokens = require("./tokens");
var models = require("../models");

module.exports = function(passport) {
  /**
   * Validate Token
   */
  router.post(
    "/validate-token",
    tokens.validateMiddleware,
    async (req, res) => {
      let user = await models.Users.findById(res.locals.user._id);
      delete user.password;
      res.send(user).status(200);
    }
  );

  /**
   * Login
   */
  router.post("/login", passport.authenticate("local"), function(req, res) {
    res.send(req.user);
  });

  /**
   * Register
   */
  router.post("/register", (req, res) => registerMiddleware(req, res));

  /**
   * Facebook Routes
   */
  router.get(
    "/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
  );

  router.get("/facebook/callback", passport.authenticate("facebook"), function(
    req,
    res
  ) {
    const user = req.user.toObject();
    res.cookie("token", user.tokens.local);
    // res.redirect('http://localhost:4000');
    res.redirect("http://4f654ffe.ngrok.io");
  });

  /**
   * Twitter Routes
   */
  router.get("/twitter", passport.authenticate("twitter"));

  router.get("/twitter/callback", passport.authenticate("twitter"), function(
    req,
    res
  ) {
    const user = req.user.toObject();
    res.cookie("token", user.tokens.local);
    res.redirect("http://localhost:4000");
  });

  /**
   * Google Routes
   */
  router.get(
    "/google",
    passport.authenticate("google", {
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/plus.login",
        "https://www.googleapis.com/auth/plus.profile.emails.read"
      ]
    })
  );

  router.get("/google/callback", passport.authenticate("google"), function(
    req,
    res
  ) {
    const user = req.user.toObject();
    res.cookie("token", user.tokens.local);
    res.redirect("http://localhost:4000");
  });

  return router;
};
