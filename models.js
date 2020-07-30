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
const usersSchema = new Schema(
  {
    email: String,
    name: String,
    password: String,
    phone: String,
    token: String,
    created: { type: Date, default: Date.now },
    integrations: {
      hubspot: {
        active: Boolean,
        user_id: Number,
        hub_domain: String,
        access_token: String,
        refresh_token: String,
        token_expiration_date: Date,
      },
    },
  },
  { strict: false }
);

usersSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

usersSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const models = {};
models.Users = mongoose.model("users", usersSchema);

module.exports = models;
