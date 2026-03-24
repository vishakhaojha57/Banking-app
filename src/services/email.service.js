require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// common Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"BankingApp" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


// registration email
async function sendRegistrationEmail(userEmail, name, userId) {
  const subject = 'Welcome to BankingApp - Registration Confirmation';
  
  const text = `Hello ${name},

Welcome to BankingApp! Your account has been successfully registered.

User ID: ${userId}

Thank you for joining us!

- BankingApp Team`;

  const html = `
    <h3>Hello ${name} 👋</h3>
    <p>Your account has been successfully registered.</p>
    <p><strong>User ID:</strong> ${userId}</p>
    <p>We are happy to have you with us 💙</p>
    <p><strong>BankingApp Team</strong></p>
  `;

  return await sendEmail(userEmail, subject, text, html);
}



// Transaction email sender
async function sendTransactionEmail(userEmail, name, transactionId, amount, toAccount, status="Completed") {
  const subject = 'Transaction Notification - BankingApp';
  
  const text = `Hello ${name},\n\nYour transaction has been processed.\n\nTransaction ID: ${transactionId}\nAmount: ${amount} INR\nStatus: ${status}\n\nBest regards,\nBankingApp Team`;
  
  const html = `
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your transaction has been processed.</p>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
          <p><strong>Amount:</strong> ${amount} INR</p>
          <p><strong>Status:</strong> ${status}</p>
          <p>Best regards,<br>
          <strong>BankingApp Team</strong></p>
          `;
  
  await sendEmail(userEmail, subject, text, html);
}


module.exports = sendEmail;
module.exports.sendRegistrationEmail = sendRegistrationEmail;
module.exports.sendTransactionEmail = sendTransactionEmail;
module.exports.transporter = transporter;