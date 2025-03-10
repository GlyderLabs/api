import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AdminModel from "../models/admin";
import WhitelistedAdminModel from "../models/whitelistedAdmin";
import { tokenService } from "../middlewares/adminAuthMiddleware";

import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const adminSignup = async (req: any, res: any) => {
  const { email, password } = req.body;

  const isWhitelisted = await WhitelistedAdminModel.findOne({ email });
  if (!isWhitelisted) return res.status(403).json({ message: "Email not whitelisted for admin access" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = new AdminModel({ email, password: hashedPassword, privilege:isWhitelisted.privilage });
  await admin.save();

  res.status(201).json({ message: "Admin account created successfully" });
};

export const adminSignin = async (req: any, res: any) => {
  const { email, password } = req.body;

  const admin = await AdminModel.findOne({ email });
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: admin._id, email: admin.email, privilege: admin.privilege }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
  await tokenService.storeToken(token, admin._id.toString());
  res.status(200).json({ token, admin: { id: admin._id, email: admin.email, privilege: admin.privilege } });
};

export const forgotPassword = async (req: any, res: any) => {
    const { email } = req.body;
  
    try {
      const user = await AdminModel.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour
      await user.save();
  
      const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      
      await sendEmail({to: email, subject: "Password Reset Request", html:`<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password.</p>`, text: ''});
      res.status(200).json({ message: "Password reset link sent to email" });
    } catch (error:any) {
      res.status(500).json({ message: "Failed to process request", error: error.message });
    }
  };
  
export const resetPassword = async (req: any, res: any) => {
    const { token, newPassword } = req.body;
  
    try {
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  
      const user = await AdminModel.findOne({
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
  
      return res.status(200).json({ message: "Password reset successful" });
    } catch (error:any) {
      return res.status(500).json({ message: "Failed to reset password", error: error.message });
    }
  };

  export const signOut = async (req: any, res: any) => {
    try {
      const admin = req.admin
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(400).json({ message: 'No token provided' });
  
      await tokenService.revokeToken(admin.id);
      res.json({ message: 'Successfully signed out' });
    } catch (err) {
      res.status(500).json({ message: 'Signout failed' });
    }
  };
