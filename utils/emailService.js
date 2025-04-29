const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = {
  sendMail: (to, subject, html) =>
    transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html })
};
