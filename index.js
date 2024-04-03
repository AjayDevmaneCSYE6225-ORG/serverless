const functions = require('@google-cloud/functions-framework');

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mysql = require("mysql");
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });

const connection = mysql.createConnection({
  host: process.env.HOST,
  user: "webapp",
  password: process.env.PASSWORD,
  database: "webapp",
});

connection.connect(function (err) {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
});

functions.cloudEvent('helloPubSub', async (cloudEvent) => {
  try {
    const base64name = cloudEvent.data.message.data;

    const data = base64name ? Buffer.from(base64name, 'base64') : 'world';

    // console.log("this is before the data console log");
    console.log(data);

    const { id, username, linkSentTime } = JSON.parse(data);
    console.log(`${id} this is the username${username}`);

    const activationLink = `https://ajaydevmane.me/v1/user/verifyUser?token=${id}`;

    console.log(linkSentTime);

    connection.query('UPDATE Users SET linkSentTime=? WHERE username=?',
    [linkSentTime, username],
    function (error, results, fields) {
      if (error) throw error;
      console.log('Verification details updated for email:', id);
    });

    const msg = await mg.messages.create('ajaydevmane.me', {
      from: "<mailgun@ajaydevmane.me>",
      to: [username],
      subject: "Account Verification",
      html: `<p>Hi ${username},</p><p>Please click <a href="${activationLink}">here</a> to verify your email address.</p><p>This link will expire in 2 minutes.</p>`
    })
    .then(msg => console.log(msg))
    .catch(err => console.log(err));
}catch(error){
    console.error(error)
}
});
