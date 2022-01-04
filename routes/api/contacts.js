const express = require("express");
const router = express.Router();
const { NotFound, BadRequest } = require("http-errors");
// const createError = require('http-errors');
const { Contact } = require("../../model");
// console.log(Contact);
const { JoiSchema } = require("../../model/contact");
const { authenticate } = require("../../middlewares");

router.get("/", async (req, res, next) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const contact = await Contact.findById(contactId);
    // const contact = await Contact.findOne({ _id: contactId });

    if (!contact) {
      throw new NotFound();
    }
    res.json(contact);
  } catch (error) {
    if (error.message.includes("Cast to ObjectId failed ")) {
      error.status = 404;
    }
    next(error);
  }
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { error } = JoiSchema.validate(req.body);
    if (error) {
      // throw new BadRequest(error.message);
      throw new BadRequest("missing required name field");
    }
    const newContact = await Contact.create(req.body);
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const deleteContact = await Contact.findByIdAndRemove(contactId);
    if (!deleteContact) {
      throw new NotFound();
    }
    res.json({ message: "contact deleted" });
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", async (req, res, next) => {
  try {
    // const { error } = JoiSchema.validate(req.body);
    // if (error) {
    //   throw new BadRequest("missing fields");
    // }

    const { contactId } = req.params;

    const updateContact = await Contact.findByIdAndUpdate(contactId, req.body, {
      new: true,
    });

    if (!updateContact) {
      throw new NotFound();
    }

    res.json(updateContact);
  } catch (error) {
    next(error);
  }
});

router.patch("/:contactId/favorite", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const { favorite } = req.body;

    if (favorite === undefined) {
      throw new BadRequest("missing field favorite");
    }

    const updateContact = await Contact.findByIdAndUpdate(
      contactId,
      { favorite },
      {
        new: true,
      }
    );

    if (!updateContact) {
      throw new NotFound();
    }

    res.json(updateContact);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
