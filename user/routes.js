const express = require("express");
const models = require("../models");
const crud = require("../crud");
const tokens = require("../auth/tokens");
const router = express.Router();

/**
 * Query user by phone and sends the user object
 * If no user is found, create a new user and send it
 */
router.get("/phone/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const user = await models.Users.findOne({ phone });
    if (user) {
      res.send(user);
    } else {
      const newUser = await models.Users.create({ phone });
      const token = await tokens.generate({ _id: newUser._id });
      await tokens.save(newUser, token);

      // Refetch recently created user
      const user = await models.Users.findOne({ phone });
      res.send(user);
    }
  } catch (err) {
    console.error("users/routes -> /phone/:phone", err);
    res.send(err).status(500);
  }
});

router.get("/current", async (req, res) => {
  try {
    const user = await models.Users.findOne({ _id: res.locals.user_id });
    res.send(user);
  } catch (err) {
    console.error("users/routes -> /current", err);
    res.send(err).status(500);
  }
});

/**
 * Crud Routes
 */
const userRoutes = crud(models.Users, router, {
  searchFields: ["name", "email", "phone"],
});

module.exports = userRoutes;
