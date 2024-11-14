import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendEmail = async (to: string, password: string) => {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "026d7a5a700d84",
      pass: "********0de1",
    },
  });

  const mailOptions = {
    to,
    subject: "Your Account Details",
    text: `Your account has been created. Here are your login details:\n\nEmail: ${to}\nPassword: ${password}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export default sendEmail;
