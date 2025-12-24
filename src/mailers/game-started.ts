import 'dotenv/config';
import { MailDataRequired } from '@sendgrid/mail';
import sendgridMail from './sendgrid';

interface UserForEmail {
  firstName: string;
  lastName: string;
  email: string;
}

interface GameForEmail {
  name: string;
}

function sendGameStartedEmail(
  game: GameForEmail,
  killer: UserForEmail,
  victim: UserForEmail,
  challenge: string,
) {
  const { firstName, lastName, email } = killer;
  const { firstName: victimFirstName, lastName: victimLastName, email: victimEmail } = victim;
  const emailData: MailDataRequired = {
    from: process.env.SENDGRID_EMAIL as string,
    to: email,
    templateId: process.env.SENDGRID_GAME_STARTED_TEMPLATE_ID as string,
    dynamicTemplateData: {
      firstName,
      lastName,
      gameName: game.name,
      victimFirstName,
      victimLastName,
      victimEmail,
      challenge,
      subject: `Te maté: ${game.name} has started`,
    },
  };

  return sendgridMail.send(emailData);
}

export = sendGameStartedEmail;
