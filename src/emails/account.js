const sgMail = require('@sendgrid/mail');
const sendGridAPIKey = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(sendGridAPIKey);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'parus@parus.io',
    subject: 'Thanks for joining in!',
    text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
  })
};

const sendCancellationEmail = (email, name) => {
sgMail.send({
  to: email,
  from: 'parus@parus.io',
  subject: 'Sorry to see you go!',
  text: `Goodbye, ${name}. I hope to see you back sometime soon.`
})
}

module.exports = {
  sendWelcomeEmail, 
  sendCancellationEmail
}