const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const env = require("./env");

// ===============
// Database Config
// ===============
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const mongoosePromise = mongoose.connect(env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoosePromise.catch((reason) => {
  console.log(reason);
});

// =======
// Schemas
// =======

/**
 * User Schema
 */
const usersSchema = new Schema({
  email: String,
  name: String,
  password: String,
  phone: String,
  token: String,
  created: { type: Date, default: Date.now },
});

/**
 * Posts Schema
 */
const postsSchema = new Schema({
  title: String,
  content: String,
  author: Schema.ObjectId,
  created: { type: Date, default: Date.now },
});

// ==============
// Schema Methods
// ==============
usersSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

usersSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// =======
// Exports
// =======
const models = {};
models.Users = mongoose.model("users", usersSchema);
models.Posts = mongoose.model("posts", postsSchema);
module.exports = models;
