const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false }));

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/send-email');
});

// Handle form submission and send email
app.post('/send-email', (req, res) => {
    const names = req.body.names;
    
    // Configure nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'Mellanu10@gmail.com',
            pass: ''
        }
    });

    // Email options
    const mailOptions = {
        from: 'Mellanu10@gmail.com',
        to: 'rehemamanuella@gmail.com',
        subject: names,
        text:  `Name: ${names}`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
