const functions = require('@google-cloud/functions-framework');

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mysql = require("mysql");
const mg = mailgun.client({ username: 'api', key: "8122f07832c4275014ebfb69e57188e8-f68a26c9-60050ad1" });

const pool = mysql.createConnection({
  host: "10.16.64.11",
  user: "webapp",
  password: "cpSbC6ktmub0Fc26",
  database: "webapp",
});

pool.connect(function (err) {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + pool.threadId);
});

functions.cloudEvent('helloPubSub', async (cloudEvent) => {
  try {
    const base64name = cloudEvent.data.message.data;

    const data = base64name ? JSON.parse(Buffer.from(base64name, 'base64')) : {};

    console.log("this is before the data console log");
    console.log(data);

    const { id, timestamp } = data;
    console.log(`${id} this is the timestamp${timestamp}`);

    const activationLink = data.id && data.timestamp ? `http://ajaydevmane.me:3000/v1/user/verifyUser?token=${data.id}&timestamp=${data.timestamp}` : '';

    const msg = await mg.messages.create('ajaydevmane.me', {
      from: "<mailgun@ajaydevmane.me>",
      to: ["devmane.a@northeastern.edu"],
      subject: "Hello",
      html: `<p>Hi ${data.id},</p><p>Please click <a href="${activationLink}">here</a> to verify your email address.</p><p>This link will expire in 2 minutes.</p>`
    });

    const queryString = `UPDATE Users SET linkSentTime = NOW() WHERE id = '${id}'`;

    pool.query(queryString, (err, results) => {
      if (err) {
        console.error('Error updating linkSentTime:', err);
        return;
      }
      console.log('linkSentTime updated successfully:', results);
    });

    console.log(msg); // logs response data
  } catch (error) {
    console.error(error); // logs any error
  }
});
