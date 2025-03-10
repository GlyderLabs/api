import mongoose, { Schema, Document } from "mongoose";

export interface IMasterRepo extends Document {
  _id: string;
  repoId: string;
  master: string;
  createdAt: Date;
  updatedAt: Date;
}

const MasterSchema: Schema = new Schema({
  repoId: { type: String, required: true },
  master: { type: String, required: true },
  
}, { timestamps: true });

export default mongoose.model<IMasterRepo>("Master", MasterSchema);