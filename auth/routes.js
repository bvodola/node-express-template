const express = require("express");
const { registerMiddleware } = require("./index");
const router = express.Router();
const tokens = require("./tokens");
const models = require("../models");

module.exports = function (passport) {
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
  router.post("/login", passport.authenticate("local"), function (req, res) {
    res.send(req.user);
  });

  /**
   * Register
   */
  router.post("/register", (req, res) => registerMiddleware(req, res));

  return router;
};
