const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'harshchoudharyv@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your_app_password'
  }
});

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email server connection failed:', error);
  } else {
    console.log('✅ Email server ready');
  }
});

module.exports = transporter;