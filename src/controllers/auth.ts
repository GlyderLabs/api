import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/user";
import crypto from "crypto";
import OTPModel from "../models/otp";
import { sendEmail } from "../utils/sendEmail";
import { tokenService } from "../middlewares/authMiddleware";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const signup = async (req: any, res: any) => {
  try{
    const { firstName, lastName, email, password } = req.body;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ message: "Invalid email format" });

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(password))
        return res.status(400).json({ message: "Password must meet complexity requirements" });

        const userExist = await UserModel.findOne({email: email})
        if(userExist) return res.status(400).json({ message: "user with email already exist" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({ firstName, lastName, email, password: hashedPassword });
    await user.save();

    const otp = generateOTP();
    await OTPModel.create({ email, otp });
    await sendEmail({to: email, subject:"Your OTP Code", text:`Your OTP is: ${otp}`, html: ""});

    return res.status(201).json({ message: "Signup successful! Please verify your email with OTP." });
    }catch(error: any){
        return res.status(500).json({ message:"failed to process request", error: error.message });
    }
};

export const verifyOtp = async (req: any, res: any) => {
  try{
    const { email, otp } = req.body;

  const validOtp = await OTPModel.findOne({ email, otp });
  
  if (!validOtp) return res.status(400).json({ message: "Invalid or expired OTP" });
    await UserModel.findOneAndUpdate({email: email}, {emailVerified: true}, {new: true})
  await OTPModel.deleteMany({ email });
  return res.status(200).json({ message: "Email verified successfully!" });
    }catch(error: any){
        return res.status(500).json({ message: "failed to process request", error: error.message });
    }
};

export const resendOtp = async (req: any, res: any) => {
  try{
    const { email } = req.body;
    const userExist = await UserModel.findOne({email: email})
    if(userExist?.emailVerified) return res.status(200).json({ message: "user email already verified" });
    const otp = generateOTP();
    const otpExist = await OTPModel.findOne({email: email})
    if(otpExist) {
        await OTPModel.findOneAndUpdate({email: email}, {otp: otp}, {new: true});
        await sendEmail({to: email, subject:"Your OTP Code", text:`Your OTP is: ${otp}`, html: ""});
        return res.status(200).json({ message: "OTP resent successfully!" });
    }
    
    await OTPModel.create({ email, otp });
    await sendEmail({to: email, subject:"Your OTP Code", text:`Your OTP is: ${otp}`, html: ""});

    return res.status(200).json({ message: "OTP resent successfully!" });
    }catch(error: any){
        return res.status(500).json({ message: "error processing request",error: error.message });
    }
};

export const signin = async (req: any, res: any) => {
  try{
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.emailVerified) return res.status(401).json({ message: "verify email" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET as string, {
        expiresIn: "1h",
    });
    await tokenService.storeToken(token, user._id.toString());
    return res.status(200).json({ token, user: { id: user._id, email: user.email } });
    }catch(error: any){
        return res.status(500).json({ message: "error processing request",error: error.message });
    }
};

export const forgotPassword = async (req: any, res: any) => {
    const { email } = req.body;
  
    try {
      const user = await UserModel.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour
      await user.save();
  
      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
      const html = `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password.</p>`

      await sendEmail({to: email, subject: "Password Reset Request", html: html, text:""});
  
      return res.status(200).json({ message: "Password reset link sent to email" });
    } catch (error:any) {
      return res.status(500).json({ message: "Failed to process request", error: error.message });
    }
};
  
export const resetPassword = async (req: any, res: any) => {
    const { token, newPassword } = req.body;

    try {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await UserModel.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = "";
        user.resetPasswordExpires = 0;

        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error:any) {
        res.status(500).json({ message: "Failed to reset password", error: error.message });
    }
};

export const signOut = async (req: any, res: any) => {
  try {
    const user = req.user
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(400).json({ message: 'No token provided' });

    await tokenService.revokeToken(user.id);
    return res.status(200).json({ message: 'Successfully signed out' });
  } catch (err) {
    res.status(500).json({ message: 'Signout failed' });
  }
};