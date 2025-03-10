import { Request, Response } from "express";
import UserModel from "../models/user"
import { callRpcServer } from "../queue/Rpc";
import AgentTeamModel from "../models/agent";
import ReceiveAddressModel from "../models/receiveAddress";
import { uploadToCdn, downloadCdn, upload_dir_ipfs } from "../utils/helper";
import fs from "fs"
import crypto from "crypto";
import { encrypt } from "../utils/encryption";
import { v4 as uuidv4 } from 'uuid';

const ITEMS_PER_PAGE = 100;


export const getUser = async (req: any, res: any) => {
  try{
   
    const user = req.user
    const _user = await UserModel.findById(user.id)
    if (!_user) {
      return res.status(404).json({ message: "User not found", data: null });
    }
    const userResponse = {
      userId: _user.id,
      email: _user.email,
    }
    return res.status(200).json({ message: "User fetched successfully", data: userResponse });
  }catch(e:any){
    res.status(500).json({ message: "Failed to get user", error: e.message, data : null });
  }
}

export const getAllAgents = async (req: any, res: any) => {
  try{
    const agents = await callRpcServer({
      method: 'allAgents',
      args: {}
    })
    if(!agents) return res.status(404).json({ message: "Agents not found", data: null });
    if(agents.data === null) return res.status(404).json({ message: "Agents not found", data: null });
    return res.status(200).json({ message: "Agents fetched successfully", data:  agents  });
  }catch(e:any){
    res.status(500).json({ message: "Failed to get agents", error: e.message, data : null });
  }
}

export const getAllPrebuiltAgents = async (req: any, res: any) => {
  try{
    const prebuiltAgents = await callRpcServer({
      method: 'getAllTeams',
      args: {}
    })
    if(!prebuiltAgents) return res.status(404).json({ message: "Agents not found", data: null });
    if(prebuiltAgents.data === null) return res.status(404).json({ message: "Agents not found", data: null });
    return res.status(200).json({ message: "Agents fetched successfully", data:  prebuiltAgents  });
  }catch(e:any){
    res.status(500).json({ message: "Failed to get agents", error: e.message, data : null });
  }
}

export const getAgentByIds = async (req: any, res: any) => {
  try{
    const { agentIds } = req.body
    const agents = await callRpcServer({
      method: 'getAgentsByIds',
      args: { agentIds },
    })
    if(!agents) return res.status(404).json({ message: "Agents not found", data: null });
    if(agents.data === null) return res.status(404).json({ message: "Agents not found", data: null });
    return res.status(200).json({ message: "Agents fetched successfully", data: { agents } });
  }catch(e:any){
    res.status(500).json({ message: "Failed to get agents", error: e.message, data : null });
  }
}

export const getAgentByCategory = async (req: any, res: any) => {
  try{
    const { category } = req.body
    const agents = await callRpcServer({
      method: 'getAgentsByCategory',
      args: { category },
    })
    if(!agents) return res.status(404).json({ message: "Agents not found", data: null });
    return res.status(200).json({ message: "Agents fetched successfully", data: { agents } });
  }catch(e:any){
    res.status(500).json({ message: "Failed to get agents", error: e.message, data : null });
  }
}


//options: 1: selfProvision, 2: prebuilt
//teams: [{id: "SM0001", name: "", description: "", image: "", agentIds: []}]
export const recruitNewAgents = async (req: any, res: any) => {
  try{
    const { teams, name, provision} = req.body
    const user = req.user
    if(!teams) return res.status(400).json({ message: "Invalid request", data: null });
    const teamId = uuidv4()
    
    const agentTeam  = new AgentTeamModel({
      id: teamId,
      name: name?name:"Untitled",
      provisionType: provision,
      teams: teams,
      userId: user.id,
    })
    await agentTeam.save()
    return res.status(200).json({ message: "Team created successfully", data: { teamId: agentTeam.id } });
  }catch(e:any){
    console.log("error", e)
    return res.status(500).json({ message: "Failed to get agents", error: e.message, data : null });
  }
}


export const recruitToTeam = async (req:any, res:any) => {
  try{
    const { teamId, agentIds } = req.body
    const user = req.user
    const agentTeam = await AgentTeamModel.findOne({ id: teamId, userId: user.id })
    if(!agentTeam) return res.status(404).json({ message: "Team not found", data: null });
    agentTeam.teams.forEach((x:any) => {
      x.agentIds.push(...agentIds)
    })
    await agentTeam.save()
    return res.status(200).json({ message: "Team updated successfully", data: { teamId: agentTeam.id } });
  }catch(e:any){
    res.status(500).json({ message: "Failed to get agents", error: e.message, data : null });
  }
}

export const updateTeamName = async (req:any, res:any) => {
  try{
    const { teamId, name } = req.body
    const user = req.user
    const agentTeam = await AgentTeamModel.findOne({ id: teamId, userId: user.id })
    if(!agentTeam) return res.status(404).json({ message: "Team not found", data: null });
    agentTeam.name = name
    await agentTeam.save()
    return res.status(200).json({ message: "Team updated successfully", data: { teamId: agentTeam.id } });
  }catch(e:any){
    res.status(500).json({ message: "Failed to get agents", error: e.message, data : null });
  }
}

//fix the getUserTeamById

export const getUserTeamById = async (req:any, res:any) => {
  try{
    const teamId = req.params.teamId
    const user = req.user
    const agentTeam = await AgentTeamModel.findOne({ id: teamId, userId: user.id })
    if(!agentTeam) return res.status(404).json({ message: "Team not found", data: null });
    const agentIds = agentTeam.teams.map((x:any) => x.agentIds).flat(2)
    const agents = await callRpcServer({
      method: 'getAgentsByIds',
      args: { agentIds: agentIds }
    })
    if(!agents) return res.status(404).json({ message: "Members not found", data: null });
    //categorize members by team
    // membersByTeam should return an array of objects with the members

    const membersByTeam = agents.reduce((acc: any, curr: any) => {
      const team = agentTeam.teams.find((x: any) => x.agentIds.includes(curr.id));
      if (team) {
        acc.push(curr);
      }
      return acc;
    }, []);

    const agentTeamResponse = {
      id: agentTeam.id,
      name: agentTeam.name,
      description: agentTeam.description,
      provisionType: agentTeam.provisionType,
      image: agentTeam.image,
      members: membersByTeam,
      createdAt: agentTeam.createdAt,
    }
    return res.status(200).json({ message: "Team fetched successfully", data:  agentTeamResponse  });
  }catch(e:any){
    console.log("error", e)
    res.status(500).json({ message: "Failed to get agents", error: e.message, data : null });
  }
}

export const getUserTeams = async (req:any, res:any) => {
  try{
    const user = req.user
    const agentTeams = await AgentTeamModel.find({ userId: user.id })
    if(!agentTeams) return res.status(404).json({ message: "Teams not found", data: null });

    const teamIds = agentTeams.map((x:any) => x.id).flat(2)
    const agentIds = agentTeams.map((x:any) => x.teams.map((y:any) => y.agentIds)).flat(2)
    const agents = await callRpcServer({
      method: 'getAgentsByIds',
      args: { agentIds: agentIds }
    })

    if(!agents) return res.status(404).json({ message: "Teams not found", data: null });

    // Create a map of agents by their IDs for faster lookup
    const agentsById = agents.reduce((map: any, agent: any) => {
      map[agent.id] = agent;
      return map;
    }, {});

    // For each team, find its agents based on the agentIds
    const teamsWithAgents = agentTeams.map((team: any) => {
      const teamAgentIds = team.teams.map((subTeam: any) => subTeam.agentIds).flat();
      const teamAgents = teamAgentIds.map((id: string) => agentsById[id]).filter(Boolean);
      
      return {
        id: team.id,
        name: team.name,
        description: team.description,
        image: team.image,
        provisionType: team.provisionType,
        members: teamAgents,
        createdAt: team.createdAt
      };
    });

    return res.status(200).json({ 
      message: "Teams fetched successfully", 
      data: teamsWithAgents 
    });
  }catch(e:any){
    console.log("error", e)
    res.status(500).json({ message: "Failed to get agents", error: e.message, data : null });
  }
}


export const upload = async (req: any, res: any) => {
  try {
    const files = req.files
    //const upload:UpdateApiOptions = await uploadToCdn(files[0].path)
    if(!files) return res.status(404).json({message: 'files not found', data: null})
    const upload = await upload_dir_ipfs(files[0].destination)
    if(!upload) return res.status(400).json({ message: "error upload file", data: null})
    const itemCid = upload.IpfsHash;
    const fileData = files.map((x:any) => 
      {return {
        name: x.filename,
        url: `https://ipfs.io/ipfs/${itemCid}/${x.filename}`,
        size: x.size,
      }
    });
    return res.status(200).json({message: 'files uploaded successfully', data: { items:  fileData}})
  } catch (error: any) {
    res.status(500).json({ message: "Upload fail", error: error.message });
  }
};
