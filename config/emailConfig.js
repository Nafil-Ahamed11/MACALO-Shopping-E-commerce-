const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({

    service:'Gmail',
    auth:{
        user:'nafilbng11@gmail.com',
        pass:'onhv oyva hgmb aonk'
    }
})

const sendEmail = (to, subject, text) => {
    const mailOptions = {
      from: 'your-email@gmail.com',
      to,
      subject,
      text,
    };
  
    return transporter.sendMail(mailOptions);
  };
  

module.exports ={
sendEmail
} 