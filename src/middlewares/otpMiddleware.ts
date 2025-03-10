import { Request, Response, NextFunction } from "express";
import OTPModel from "../models/otp";

export const validateOTP = async (req: any, res: any, next: NextFunction) => {
  const { email, otp } = req.body;

  const validOtp = await OTPModel.findOne({ email, otp });
  if (!validOtp) return res.status(400).json({ message: "Invalid or expired OTP" });

  next();
}; 