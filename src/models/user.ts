import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean,
  password: string;
  resetPasswordToken: string;
  resetPasswordExpires: number;
  createdAt: Date;
  updatedAt:Date;
}

const UserSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, default: false},
  password: { type: String, required: true },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Number , default: null},
}, { timestamps: true });

export default mongoose.model<IUser>("User", UserSchema);
