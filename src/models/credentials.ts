import mongoose, { Schema, Document } from "mongoose";

export interface ICredentials extends Document {
  _id: string; 
  userId: string;
  teamId: string;
  agentId: string;
  credentials: string;
  createdAt: Date;
  updatedAt: Date;
}

const CredentialsSchema: Schema = new Schema({
  userId: { type: String, required: true },
  teamId: { type: String, required: true },
  agentId: { type: String, required: true },
  credentials: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ICredentials>("Credentials", CredentialsSchema);