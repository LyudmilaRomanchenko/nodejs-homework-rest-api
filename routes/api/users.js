const express = require("express");
const router = express.Router();
const { BadRequest, Conflict, Unauthorized } = require("http-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../../model");
const { JoiSchema } = require("../../model/user");
const { SECRET_KEY } = process.env;

router.post("/signup", async (req, res, next) => {
  try {
    const { error } = JoiSchema.validate(req.body);

    if (error) {
      throw new BadRequest("Ошибка от Joi или другой библиотеки валидации");
    }

    const { email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const user = await User.findOne({ email });
    if (user) {
      throw new Conflict("Email in use");
    }

    const newUser = await User.create({
      email,
      password: hashPassword,
    });

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const loginError = new Unauthorized("Email or password is wrong");
  try {
    const { error } = JoiSchema.validate(req.body);

    if (error) {
      throw new BadRequest("Ошибка от Joi или другой библиотеки валидации");
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw loginError;
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw loginError;
    }

    const { subscription, _id } = user;

    const payload = {
      id: user._id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
    await User.findByIdAndUpdate(_id, { token });
    res.json({
      token,
      user: {
        email,
        subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
