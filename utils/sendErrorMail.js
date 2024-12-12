import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.email,
    pass: process.env.pass,
  },
});

export default async function sendErrorMail(error) {
  const info = await transporter.sendMail({
    from: `"SIH Server" <${process.env.email}>`,
    to: "parthjee3.14@gmail.com",
    subject: `You got error`,
    text: JSON.stringify(error),
  });
}