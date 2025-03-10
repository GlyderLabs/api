import mongoose, { Schema, Document } from "mongoose";

export interface IAgentTeam extends Document {
  _id: string;
  id: string;
  userId: string;
  name: string;
  description: string;
  image: string;
  provisionType: number;
  teams: Array<{
    id: string;
    name?: string;
    supervisorPrompt?: string;
    extraInfo?: string[];
    agentIds: Array<string>;
    description?: string;
  }>;
  createdAt: Date;
  updatedAt:Date;
}

//type: 1: selfProvisioned, 2: assisted
const AgentTeamSchema: Schema = new Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  provisionType: { type: Number, required: true },
  teams: { type: [Object], required: true },
  description: { type: String },
  image: { type: String },
}, { timestamps: true });

export default mongoose.model<IAgentTeam>("AgentTeam", AgentTeamSchema);
