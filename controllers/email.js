const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  name: 'www.probotplayground.com',
  host: 'mail.probotplayground.com',
  port: 26,
  secure: false, // true for 465, false for other ports
  ignoreTLS: true,
  auth: {
    user: 'donotreply@probotplayground.com',//process.env.EMAIL_USERNAME,
    pass: 'proBot13!'//process.env.EMAIL_PASSWORD
  }
});

sendAccountVerification = (link, email) => {
  transporter.sendMail({
    from: '"Probot Playground" <donotreply@probotplayground.com>', // sender address
    to: email, // list of receivers
    subject: 'Account Email Validation', // Subject line
    text: `Thank you for creating a Probot Playground account. Please validate your email with the following link: ${link}`, // plain text body
    html: `<p>Thank you for creating a Probot Playground account. Please validate your email with the following link: <a href='${link}'>Verify Email</a></p>` // html body
  }, (err) => {
    if (err)
      console.log(err);
  });
};

sendResetPassword = (link, email) => {
  transporter.sendMail({
    from: '"Probot Playground" <donotreply@probotplayground.com>', // sender address
    to: email, // list of receivers
    subject: 'Reset Password', // Subject line
    text: `Please use the following link to reset your password: ${link}`, // plain text body
    html: `<p>Please use the following link to reset your password: <a href='${link}'>Reset Password</a></p>` // html body
  }, (err) => {
    if (err)
      console.log(err);
  });
};

sendReferral = (link, email, username) => {
  transporter.sendMail({
    from: '"Probot Playground" <donotreply@probotplayground.com>', // sender address
    to: email, // list of receivers
    subject: 'Friend Referral', // Subject line
    text: `${username} has invited you to join Probot Playground. Use the following link to get started: ${link}`, // plain text body
    html: `<p>${username} has invited you to join Probot Playground. Use the following link to get started: <a href='${link}'>Create Account</a></p>` // html body
  }, (err) => {
    if (err)
      console.log(err);
  });
};

sendFriendInvite = (link, email, username) => {
  transporter.sendMail({
    from: '"Probot Playground" <donotreply@probotplayground.com>', // sender address
    to: email, // list of receivers
    subject: 'Friend Invite', // Subject line
    text: `${username} would like to be friends. Use the following link to accept: ${link}`, // plain text body
    html: `<p>${username} would like to be friends. Use the following link to accept: <a href='${link}'>Accept</a></p>` // html body
  }, (err) => {
    if (err)
      console.log(err);
  });
};

module.exports = {
  sendAccountVerification,
  sendResetPassword,
  sendReferral,
  sendFriendInvite
};

