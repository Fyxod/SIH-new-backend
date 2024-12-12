import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export default async function sendEmail(to, subject, text, attachment) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.email,
        pass: process.env.pass, 
      },
    });
  
    const mailOptions = {
      from: process.env.email,
      to: "omrajpal.exe@gmail.com",
      subject: subject,
      text: text,
      attachments: [
        {
          filename: "Interview Details.pdf",
          content: attachment,
        },
      ],
    };
  
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  }
  