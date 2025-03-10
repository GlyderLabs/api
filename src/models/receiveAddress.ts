import mongoose, { Schema, Document } from "mongoose";

export interface IReceiveAddress extends Document {
  encryptedAddress: string;
  orderId?: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
}

const ReceiveAddressSchema: Schema = new Schema(
  { 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    encryptedAddress: { type: String, required: true },
    orderId: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IReceiveAddress>("ReceiveAddress", ReceiveAddressSchema);
