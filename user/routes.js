const express = require("express");
const models = require("../models");
const crud = require("../crud");
const router = express.Router();

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
