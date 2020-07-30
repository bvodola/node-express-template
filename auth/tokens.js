const jwt = require("jsonwebtoken");
const { Users } = require("../models");
const { getNewTokens } = require("../hubspot/controllers");

let tokens = {};

tokens.generate = (data) => {
  return new Promise((resolve, reject) => {
    jwt.sign(data, "robocopisthesecret", {}, function (err, token) {
      if (err) reject(err);
      else {
        resolve(token);
      }
    });
  });
};

tokens.save = (user, token) => {
  return new Promise((resolve, reject) => {
    Users.findByIdAndUpdate(
      user._id,
      {
        token,
      },
      function (err, response) {
        if (err) reject(err);
        else resolve(response);
      }
    );
  });
};

tokens.validate = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, "robocopisthesecret", function (err, data) {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

tokens.validateMiddleware = (config = {}) => async (req, res, next) => {
  if (!config.bypass) config.bypass = () => false;

  if (config.bypass(req) === true) {
    next();
    return;
  }

  if (req.method !== "OPTIONS") {
    if (typeof req.headers.authorization !== "undefined") {
      const token = String(req.headers.authorization).split("Bearer ")[1];
      const token_data = await tokens.validate(token);
      if (token.data !== "undefined") {
        res.locals.user_id = token_data._id;
        next();
      } else {
        res.sendStatus(401);
      }
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(200);
  }
};

/**
 * Middleware that translates local token to HubSpot access_token
 * if current access_token is still valid. It also refreshes
 * the token and stores it in database in needed
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
tokens.checkHubspotIntegration = async (req, res, next) => {
  try {
    const user = await Users.findById(res.locals.user_id).lean();

    // Check if the user has a proper integration object
    if (
      user.integrations &&
      user.integrations.hubspot &&
      user.integrations.hubspot.access_token
    ) {
      const {
        token_expiration_date,
        refresh_token,
        access_token,
      } = user.integrations.hubspot;
      let hubspotToken = access_token;
      let newTokenData;

      // Check if current Hubspot token is valid, and if not
      // call function to refresh it and stores in database
      if (token_expiration_date <= new Date()) {
        newTokenData = await getNewTokens(refresh_token);
        hubspotToken = newTokenData.access_token;
        await Users.findByIdAndUpdate(user._id, {
          $set: {
            integrations: {
              hubspot: {
                ...user.integrations.hubspot,
                access_token: newTokenData.access_token,
                refresh_token: newTokenData.refresh_token,
              },
            },
          },
        });
      }

      // Add the current valid token to res.locals and call next()
      // console.log("hubspotToken", hubspotToken);
      res.locals.hubspotToken = hubspotToken;
      next();
    } else {
      throw { message: "Hubspot Integration Object Error" };
    }
  } catch (err) {
    console.log(err);
    res
      .status(401)
      .send({ message: `Hubspot Integration Error -> ${err.message}` });
  }
};

module.exports = tokens;
