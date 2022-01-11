const express = require("express");
const router = express.Router();
const { NotFound, BadRequest } = require("http-errors");
// const createError = require('http-errors');
const { Contact } = require("../../model");
// console.log(Contact);
const { JoiSchema } = require("../../model/contact");
const { authenticate } = require("../../middlewares");

router.get("/", authenticate, async (req, res, next) => {
  try {
    const {page = 1, limit = 20} = req.query;
    const {_id} = req.user;
    const skip = (page - 1) * limit;

    const contacts = await Contact.find({owner: _id}, "", {skip, limit: +limit});
    console.log("contacts", contacts);

    const {favorite} = req.query;

    if(favorite) {
      const contactsFavorite = contacts.find(contact => contact.favorite === true);

      res.json(contactsFavorite);

    } else {
      res.json(contacts);
    }



    // res.json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", authenticate, async (req, res, next) => {
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
  console.log(req.user)
  try {
    const { error } = JoiSchema.validate(req.body);
    if (error) {
      // throw new BadRequest(error.message);
      throw new BadRequest("missing required name field");
    }

    const {_id} = req.user;

    const newContact = await Contact.create({...req.body, owner: _id});
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", authenticate, async (req, res, next) => {
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

router.put("/:contactId", authenticate, async (req, res, next) => {
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

router.patch("/:contactId/favorite", authenticate, async (req, res, next) => {
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
