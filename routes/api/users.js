const express = require("express");
const router = express.Router();
const { BadRequest, Conflict, Unauthorized, NotFound } = require("http-errors");
const Jimp = require("jimp");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs/promises");
const gravatar = require("gravatar");
const { nanoid } = require("nanoid");
const { User } = require("../../model");
const { JoiSchema } = require("../../model/user");
const { authenticate, upload } = require("../../middlewares");
const { sendEmail } = require("../../helpers");

const { SECRET_KEY, SITE_NAME } = process.env;

router.post("/signup", async (req, res, next) => {
  try {
    const { error } = JoiSchema.validate(req.body);

    if (error) {
      throw new BadRequest("Ошибка от Joi или другой библиотеки валидации");
    }

    const { email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const verificationToken = nanoid();
    const user = await User.findOne({ email });
    if (user) {
      throw new Conflict("Email in use");
    }

    const avatarURL = gravatar.url(email);
    console.log(avatarURL);

    const newUser = await User.create({
      email,
      password: hashPassword,
      avatarURL,
      verificationToken,
    });

    const data = {
      to: email,
      subject: "Подтвержденте регистрации",
      html: `<a target="_blank" href="${SITE_NAME}/users/verify/:${verificationToken}">Подтвердить email</a>`,
    };

    await sendEmail(data);

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

    if (!user.verify) {
      throw new Unauthorized("Email not verify");
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

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const { _id } = req.user;
      const { path: tempUpload, filename } = req.file;

      await Jimp.read(tempUpload)
        .then((avatar) => {
          return avatar.resize(250, 250).write(tempUpload);
        })
        .catch((err) => {
          throw err;
        });

      const [extension] = filename.split(".").reverse();
      const newFileName = `${_id}.${extension}`;
      const avatarsDir = path.join(__dirname, "../../", "public", "avatars");

      const fileUpload = path.join(avatarsDir, newFileName);
      await fs.rename(tempUpload, fileUpload);
      const avatarURL = path.join("avatars", newFileName);
      await User.findByIdAndUpdate(_id, { avatarURL }, { new: true });
      res.json({ avatarURL });
    } catch (error) {
      // await fs.unlink(tempUpload);
      next(error);
    }
  }
);

router.post("/verify", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new BadRequest("missing required field email");
    }

    const user = User.findOne({ email });

    if (!user) {
      throw new NotFound("User not found");
    }

    if (user.verify) {
      throw new BadRequest("Verification has already been passed");
    }

    const { verificationToken } = user;

    const data = {
      to: email,
      subject: "Подтвержденте регистрации",
      html: `<a target="_blank" href="${SITE_NAME}/users/verify/:${verificationToken}">Подтвердить email</a>`,
    };

    await sendEmail(data);

    res.json({
      message: "Verification email sent",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/verify/:verificationToken", async (req, res, next) => {
  try {
    const verificationToken = req.params;
    const user = User.findOne(verificationToken);
    if (!user) {
      throw new NotFound("User not found");
    }

    const { _id } = user;

    await User.findByIdAndUpdate(_id, {
      verificationToken: null,
      verify: true,
    });
    res.json({
      message: "Verification successful",
    });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
