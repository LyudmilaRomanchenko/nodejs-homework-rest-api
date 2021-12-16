// const fs = require('fs/promises')
// const contacts = require("./contacts.json");

const fs = require("fs").promises;
const path = require("path");
const { v4 } = require("uuid");

const contactsPath = path.join(__dirname, "contacts.json");
console.log(contactsPath);

// считываем список контактов
async function getContacts() {
  try {
    const data = await fs.readFile(contactsPath);
    console.log(data);

    const contactsList = JSON.parse(data);
    return contactsList;
  } catch (err) {
    console.error(err.message);
  }
}

// обновляем список контактов
async function updateContacts(contacts) {
  try {
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}

async function listContacts() {
  try {
    const contacts = await getContacts();
    console.log(contacts);
    return contacts;
  } catch (err) {
    console.error(err.message);
  }
}

async function getContactById(contactId) {
  try {
    const contacts = await getContacts();
    const result = contacts.find((contact) => contact.id === `${contactId}`);
    // const result = contacts.find((contact) => contact.id === contactId);
    console.log(result);

    if (!result) {
      return null;
    }
    return result;
  } catch (err) {
    console.error(err.message);
  }
}
// getContactById(2);

async function removeContact(contactId) {
  try {
    const contacts = await getContacts();
    const contactIndex = contacts.findIndex(
      (contact) => contact.id === `${contactId}`
    );

    if (contactIndex === -1) {
      return null;
    }

    const remove = contacts.splice(contactIndex, 1);
    updateContacts(contacts);
    return remove;
  } catch (err) {
    console.error(err.message);
  }
}

async function addContact(name, email, phone) {
  try {
    const newContact = { name, email, phone, id: v4() };
    const contacts = await getContacts();
    contacts.push(newContact);

    updateContacts(contacts);

    // по правилам база данных должна возвращать новый созданый обьект
    return newContact;
  } catch (err) {
    console.error(err.message);
  }
}

const updateContact = async (contactId, body) => {};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
