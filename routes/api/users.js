const express = require("express");
const router = express.Router();
const { BadRequest, Conflict, Unauthorized, NotFound } = require("http-errors");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs/promises");
const gravatar = require('gravatar');
const { User } = require("../../model");
const { JoiSchema } = require("../../model/user");
const { authenticate, upload } = require("../../middlewares");
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

    const avatarURL = gravatar.url(email)
    console.log(avatarURL);
    

    const newUser = await User.create({
      email,
      password: hashPassword,
      avatarURL,
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

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "8h" });
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

router.get("/logout", authenticate, async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.status(204).send();
});

router.get("/current", authenticate, async (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    user: {
      email,
      subscription,
    },
  });
});

router.patch("/", authenticate, async (req, res, next) => {
  try {
    const { subscription } = req.body;

    if (subscription === undefined) {
      throw new BadRequest("missing field subscription");
    }

    if (
      subscription === "starter" ||
      subscription === "pro" ||
      subscription === "business"
    ) {
      const { _id } = req.user;
      const updateUser = await User.findByIdAndUpdate(
        _id,
        { subscription },
        {
          new: subscription,
        }
      );

      if (!updateUser) {
        throw new NotFound();
      }

      res.json(updateUser);
    } else {
      throw new BadRequest(
        "subscription must be 'starter', 'pro' or 'business'"
      );
    }
  } catch (error) {
    next(error);
  }
});

router.patch("/avatars", authenticate, upload.single("avatar"), async (req, res, next) => {
  const {_id} = req.user;
  const {path: tempUpload, filename} = req.file;
  const [extension] = filename.split(".").reverse();
  const newFileName = `${_id}.${extension}`;
  const avatarsDir = path.join(__dirname, "../../", "public", "avatars");

  const fileUpload = path.join(avatarsDir, newFileName);
  await fs.rename(tempUpload, fileUpload);
  const avatarURL = path.join("avatars", newFileName);
  await  User.findByIdAndUpdate(_id, {avatarURL}, {new: true});
  res.json({avatarURL});
  //////////////
  // await fs.unlink(tempUpload);

})

module.exports = router;
