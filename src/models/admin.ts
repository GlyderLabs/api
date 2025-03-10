import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
  _id: string;
  email: string;
  password: string;
  privilege: number; // 0 = Basic, 1 = SuperAdmin, etc.
  resetPasswordToken: string;
  resetPasswordExpires: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  privilege: { type: Number, required: true, default: 0 },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Number , default: null},
}, { timestamps: true });

export default mongoose.model<IAdmin>("Admin", AdminSchema);