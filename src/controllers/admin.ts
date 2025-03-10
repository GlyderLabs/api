import { Request, Response } from "express";
import mongoose, { Schema, Document } from "mongoose";
import { uploadToCdn, downloadCdn, upload_dir_ipfs } from "../utils/helper";
import {UpdateApiOptions} from "cloudinary"
import UserModel from "../models/user"
import fs from "fs"
import { v4 as uuidv4 } from 'uuid';

export const getUser = async (req: any, res: any) => {
  try{
    const {userId} = req.params
    if(!userId) return res.status(400).json({ message: "invalid user id", data: null });
    const _user = await UserModel.findById(userId)
    if(!_user) return res.status(400).json({ message: "user not found", data: null });
    const userResponse = {
      userId: userId,
      firstName: _user.firstName,
      lastName: _user.lastName,
    }
    return res.status(200).json({ message: "Orders fetched successfully", data:{ user: userResponse} });
  }catch(e:any){
    res.status(500).json({ message: "Failed to get user", error: e.message, data : null });
  }
}