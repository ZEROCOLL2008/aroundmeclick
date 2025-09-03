const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// .env file එකෙන් තොරතුරු ලබාගන්නා ලෙස transporter එක සකස් කිරීම
const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: {
        user: "resend",
        pass: process.env.RESEND_KEY, // functions.config() වෙනුවට process.env භාවිතා කිරීම
    },
});

exports.sendEmailCampaign = onDocumentCreated("emailCampaigns/{campaignId}", async (event) => {
    const snap = event.data;
    if (!snap) { return; }

    const campaignData = snap.data();
    if (campaignData.status !== "pending") { return; }

    const db = admin.firestore();
    try {
        const subscribersSnapshot = await db.collection("subscribers").get();
        if (subscribersSnapshot.empty) {
            await snap.ref.update({ status: "completed", details: "No subscribers found." });
            return;
        }
        const recipientEmails = subscribersSnapshot.docs.map(doc => doc.data().email);
        
        const mailOptions = {
            from: `Around Me Click <noreply@${process.env.RESEND_DOMAIN}>`, // functions.config() වෙනුවට process.env
            to: "veoa038@gmail.com",
            bcc: recipientEmails,
            subject: campaignData.subject,
            html: campaignData.htmlContent,
        };
        
        await transporter.sendMail(mailOptions);
        
        await snap.ref.update({
            status: "completed",
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            subscriberCount: recipientEmails.length,
        });
    } catch (error) {
        console.error("Final Error Check:", error);
        await snap.ref.update({ status: "error", details: error.message });
    }
});