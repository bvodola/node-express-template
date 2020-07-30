const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
const { registerMiddleware, validateMiddleware } = require("./index");
const router = express.Router();
const tokens = require("./tokens");
const models = require("../models");
const env = require("../env");

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

  /**
   * Hubspot Auth
   */
  router.get("/hubspot/", async (req, res) => {
    try {
      const { token, email } = req.query;

      // Validate token
      const token_data = await tokens.validate(token);
      const user_id = token_data._id;

      // Save user email
      if (email) {
        await models.Users.findByIdAndUpdate(user_id, { $set: { email } });
      }

      // Build the auth URL
      const authUrl =
        "https://app.hubspot.com/oauth/authorize" +
        `?client_id=${encodeURIComponent(env.HUBSPOT_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(
          env.BACKEND_URL
        )}${encodeURIComponent(env.HUBSPOT_REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(env.HUBSPOT_SCOPES)}`;

      // Redirect the user
      res.redirect(authUrl);
    } catch (err) {
      console.log(err);
      res.send(err.message);
    }
  });

  router.get("/hubspot/callback", async (req, res) => {
    try {
      const { code } = req.query;

      const formData = querystring.stringify({
        grant_type: "authorization_code",
        client_id: env.HUBSPOT_CLIENT_ID,
        client_secret: env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: env.BACKEND_URL + env.HUBSPOT_REDIRECT_URI,
        code,
      });

      const authRes = await axios.post(
        env.HUBSPOT_API_URL + "/oauth/v1/token",
        formData
      );

      const { access_token, refresh_token } = authRes.data;

      const tokenRes = await axios.get(
        `${env.HUBSPOT_API_URL}/oauth/v1/access-tokens/${access_token}`
      );

      // Get params from tokenRes and set expiration date to 5 hours from now
      const { user, user_id, hub_domain } = tokenRes.data;
      let ted = new Date();
      ted.setHours(ted.getHours() + 5);

      const localUser = await models.Users.findOneAndUpdate(
        { email: user },
        {
          $set: {
            integrations: {
              hubspot: {
                active: true,
                user_id,
                hub_domain,
                access_token,
                refresh_token,
                token_expiration_date: ted,
              },
            },
          },
        }
      );

      if (localUser) {
        res.redirect(`${env.CHATSTER_CLIENT_URL}?token=${localUser.token}`);
      } else {
        res.send(
          "Email informado não é igual ao seu email cadastrado no hubspot."
        );
      }
    } catch (err) {
      console.log(err);
      res.send({ message: err.message });
    }
  });

  router.get("/hubspot/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.query;

      const formData = querystring.stringify({
        grant_type: "refresh_token",
        client_id: env.HUBSPOT_CLIENT_ID,
        client_secret: env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: env.BACKEND_URL + env.HUBSPOT_REDIRECT_URI,
        refreshToken,
      });

      const tokenRes = await axios.post(
        env.HUBSPOT_API_URL + "/oauth/v1/token",
        formData
      );

      res.send(tokenRes.data);
    } catch (err) {
      console.log(err);
      res.send({ message: err.message });
    }
  });

  return router;
};
