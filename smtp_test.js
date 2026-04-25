const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'glamoranepal221@gmail.com',
        pass: ''
    }
});

console.log('Testing SMTP connection with new password...');
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Connection Error:', error);
    } else {
        console.log('✅ Connection Success! SMTP is ready.');

        const mailOptions = {
            from: 'glamoranepal221@gmail.com',
            to: 'glamoranepal221@gmail.com',
            subject: 'SMTP Test - New Password',
            text: 'If you see this, the NEW SMTP password is working!'
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('❌ Send Mail Error:', err);
            } else {
                console.log('✅ Email Sent Successfully! Info:', info);
            }
        });
    }
});
