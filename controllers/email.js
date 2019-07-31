const nodemailer = require("nodemailer");
const Email = require('email-templates');

const transporter = nodemailer.createTransport({
  name: 'www.probotplayground.com',
  host: 'mail.probotplayground.com',
  port: 26,
  secure: false, // true for 465, false for other ports
  ignoreTLS: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

const emailTemplate = new Email({
  transport: transporter,
  send: true,
  preview: false,
});

const supportEmail = process.env.SUPPORT_EMAIL;

sendAccountVerification = (link, email, username) => {
  emailTemplate.send({
    template: 'registration',
    message: {
      from: 'Probot Playground <donotreply@probotplayground.com>', // sender address
      to: email,
    },
    locals: {
      link,
      username,
      supportEmail,
    },
  }).then(() => console.log('registration email sent'));
};

sendResetPassword = (link, email, username) => {
  emailTemplate.send({
    template: 'reset-password',
    message: {
      from: 'Probot Playground <donotreply@probotplayground.com>', // sender address
      to: email,
    },
    locals: {
      link,
      username,
      supportEmail,
    },
  }).then(() => console.log('reset password email sent'));
};

sendReferral = (link, email, username, chipBonus, friendEmail) => {
    emailTemplate.send({
    template: 'referral',
    message: {
      from: 'Probot Playground <donotreply@probotplayground.com>', // sender address
      to: email,
    },
    locals: {
      link,
      email: friendEmail,
      username,
      chipBonus
    },
  }).then(() => console.log('referral email sent'));
};

sendFriendInvite = (link, email, friendUsername, username, friendEmail) => {
 emailTemplate.send({
    template: 'friend-invite',
    message: {
      from: 'Probot Playground <donotreply@probotplayground.com>', // sender address
      to: email,
    },
    locals: {
      link,
      email: friendEmail,
      username,
      friendUsername,
    },
  }).then(() => console.log('invite email sent'));
};

module.exports = {
  sendAccountVerification,
  sendResetPassword,
  sendReferral,
  sendFriendInvite
};

