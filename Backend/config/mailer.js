const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function sendVerificationEmail(toEmail, token, callback) {

    const verifyLink = `${process.env.BASE_URL}/api/verify-email?token=${token}`;

    const mailOptions = {
        from: `"College Notes" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Verify Your Email - College Notes Website",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
                <h2>Verify Your Email</h2>
                <p>Thanks for registering on College Notes Website. Click below to verify your account:</p>
                <a href="${verifyLink}" style="display:inline-block; padding:12px 24px; background:#4f46e5; color:#fff; text-decoration:none; border-radius:6px;">
                    Verify Email
                </a>
                <p>Or paste this link into your browser:</p>
                <p>${verifyLink}</p>
                <p>This link expires in 30 minutes.</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (callback) callback(error, info);
    });
}

module.exports = { sendVerificationEmail };