import 'dotenv/config';
import { MailDataRequired } from '@sendgrid/mail';
import sendgridMail from './sendgrid';

interface UserForEmail {
  firstName: string;
  lastName: string;
  email: string;
}

function sendConfirmAccountEmail(user: UserForEmail, token: string) {
  const { firstName, lastName, email } = user;
  const emailData: MailDataRequired = {
    from: process.env.SENDGRID_EMAIL as string,
    to: email,
    templateId: process.env.SENDGRID_CONFIRM_ACCOUNT_TEMPLATE_ID as string,
    dynamicTemplateData: {
      firstName,
      lastName,
      confirmationURL: `${process.env.CONFIRMATION_ACCOUNT_BACKEND_URL}${token}`,
      desconfirmationURL: `${process.env.DESCONFIRMATION_ACCOUNT_BACKEND_URL}${token}`,
    },
  };

  return sendgridMail.send(emailData);
}

export = sendConfirmAccountEmail;
