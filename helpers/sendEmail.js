const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const { SENDGRID_API_KEY } = process.env;
const { MY_EMAIL } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

// const data = {
//   to: "socoj75776@icesilo.com",
//   subject: "Заявка",
//   html: "<p>Заявка принята</p>",
// };

const sendEmail = async (data) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const email = { ...data, from: MY_EMAIL };
    console.log(data);
    await sgMail.send(email);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports(sendEmail);

// /////////////////
// ============== Using meta.ua ====================
// const nodemailer = require("nodemailer");
// const { META_PASSWORD } = process.env;

// const nodemailerConfig = {
//   host: "smtp.meta.ua",
//   port: 465,
//   secure: true,
//   auth: {
//     user: "nowebeauty31@meta.ua",
//     pass: META_PASSWORD,
//   },
// };

// const transporter = nodemailer.createTransport(nodemailerConfig);

// const email = {
//   to: "socoj75776@icesilo.com",
//   from: "nowebeauty31@meta.ua",
//   subject: "Заявка",
//   html: "<p>Заявка принята</p>",
// };

// transporter
//   .sendMail(email)
//   .then(() => console.log("Success"))
//   .catch((error) => console.log(error.message));
