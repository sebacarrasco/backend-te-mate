require('dotenv').config();

const sendgridMail = require('./sendgrid');

module.exports = function sendGameStartedEmail(game, killer, victim, challenge) {
  const { firstName, lastName, email } = killer;
  const { firstName: victimFirstName, lastName: victimLastName, email: victimEmail } = victim;
  const emailData = {
    from: process.env.SENDGRID_EMAIL,
    personalizations: [{
      to: {
        email,
      },
      dynamic_template_data: {
        firstName,
        lastName,
        gameName: game.name,
        victimFirstName,
        victimLastName,
        victimEmail,
        challenge,
        subject: `Te maté: ${game.name} has started`,
      },
    }],
    template_id: process.env.SENDGRID_GAME_STARTED_TEMPLATE_ID,
  };

  return sendgridMail.send(emailData);
};
