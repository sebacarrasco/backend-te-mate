require('dotenv').config();

const sendgridMail = require('./sendgrid');

module.exports = function sendConfirmAccountEmail(user, token) {
  const { firstName, lastName, email } = user;
  const emailData = {
    from: process.env.SENDGRID_EMAIL,
    personalizations: [{
      to: {
        email,
      },
      dynamic_template_data: {
        firstName,
        lastName,
        confirmationURL: `${process.env.CONFIRMATION_ACCOUNT_BACKEND_URL}${token}`,
        desconfirmationURL: `${process.env.DESCONFIRMATION_ACCOUNT_BACKEND_URL}${token}`,
      },
    }],
    template_id: process.env.SENDGRID_CONFIRM_ACCOUNT_TEMPLATE_ID,
  };

  return sendgridMail.send(emailData);
};
