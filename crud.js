const express = require("express");

const defaultCallbacks = {
  get: (data) => data,
  post: (data) => data,
  put: (data) => data,
  delete: (data) => data,
};

module.exports = (Collection, config, router) => {
  // ======
  // Config
  // ======
  if (!config) config = {};
  let callbacks = Object.assign({}, defaultCallbacks, config.callbacks);
  if (!router) {
    router = express.Router();
  }

  // ======
  // Create
  // ======
  router.post("/", (req, res) => {
    const newEntry = req.body;
    const cb = (e, newEntry) => {
      if (e) {
        console.log(e);
        res.sendStatus(500);
      } else res.send(newEntry);
    };

    console.log("newEntry", newEntry);
    if (newEntry instanceof Array) {
      Collection.insertMany(newEntry, (e, newEntry) => {
        cb(e, newEntry);
      });
    } else {
      Collection.create(newEntry, (e, newEntry) => {
        cb(e, newEntry);
      });
    }
  });

  // =======
  // Get One
  // =======
  router.get("/:_id", async (req, res) => {
    try {
      const entry = await Collection.findById(req.params._id);
      res.send(entry);
    } catch (err) {
      console.log("CRUD findById ERROR", err);
      res.send({
        message: err.message,
      });
    }
  });

  // ========
  // Get Many
  // ========
  router.get("/*", async (req, res) => {
    try {
      // Get params from URL query
      const { q, _start, _end, _order, _sort } = req.query;
      let query = {};

      // ============
      // Search Query
      // ============
      if (
        q &&
        Array.isArray(config.textSearchParams) &&
        config.textSearchParams.length > 0
      ) {
        // Create Text Query
        query = {
          $or: [],
        };

        config.textSearchParams.forEach((param) => {
          regexQuery = {
            [param]: {
              $regex: q,
              $options: "i",
            },
          };
          // regexQuery = { [param]: new RegExp("^" + q + "$", "i") };
          query.$or.push(regexQuery);
        });
      } else {
        Object.keys(req.query).forEach((param) => {
          if (param !== "q" && param[0] !== "_") {
            query[param] = req.query[param];
          }
        });
      }

      // =============
      // Execute Query
      // =============
      const data = await Collection.find(query, null, {
        sort: {
          [_sort]: _order === "ASC" ? 1 : -1,
        },
        skip: Number(_start),
        limit: Number(_end) - Number(_start),
      });

      const totalCount = await Collection.countDocuments(query);

      res.header("Access-Control-Expose-Headers", "X-Total-Count");
      res.set("X-Total-Count", totalCount);
      res.send(data);
    } catch (err) {
      console.log("CRUD find ERROR", err);
      res.send({
        message: err.message,
      });
    }
  });

  // ======
  // Update
  // ======
  router.put("/:_id", async (req, res) => {
    const changedEntry = req.body;

    Collection.findOneAndUpdate(
      { _id: req.params._id },
      { $set: changedEntry },
      { new: true, useFindAndModify: false },
      (err, doc) => {
        if (err)
          res.status(500).send({
            message: err.message,
          });
        res.status(200).send(doc);
      }
    );
  });

  // ======
  // Delete
  // ======
  router.delete("/:_id", (req, res) => {
    Collection.remove({ _id: req.params._id }, (err, doc) => {
      if (err) res.send(err.message);
      else res.status(200).send(doc);
    });
  });

  return router;
};
