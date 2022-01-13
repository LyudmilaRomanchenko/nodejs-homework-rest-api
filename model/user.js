const { Schema, model } = require("mongoose");

const userSchema = Schema({
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  subscription: {
    type: String,
    enum: ["starter", "pro", "business"],
    default: "starter",
  },
  token: {
    type: String,
    default: null,
  },
});

const User = model("user", userSchema);

const Joi = require("joi");
const JoiSchema = Joi.object({
  password: Joi.string().required(),
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: true } })
    .required(),
  subscription: Joi.string().valueOf("starter", "pro", "business"),
});

module.exports = {
  User,
  JoiSchema,
};
