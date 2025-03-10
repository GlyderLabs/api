import mongoose, { Schema, Document } from "mongoose";

export interface IWhitelistedAdmin extends Document {
  email: string;
  privilage: number
}

const WhitelistedAdminSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  privilage: {type: Number, required: true, default: 0}
}, { timestamps: true });

export default mongoose.model<IWhitelistedAdmin>("WhitelistedAdmin", WhitelistedAdminSchema);
