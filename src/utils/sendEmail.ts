import nodemailer from "nodemailer";
import dotenv from "dotenv"
dotenv.config()

export const sendEmail = async ({to, subject, text, html} : {to: string, subject: string, text: string, html: string}): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text,  html: html});
};