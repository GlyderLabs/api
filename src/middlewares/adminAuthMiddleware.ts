import { Request, Response, NextFunction } from "express";
import { createClient } from 'redis';
import { setItem, getItem, deleteItem, tokenExists } from '../utils/redis';
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import admin from "../models/admin";

// Redis Client Setup
// export const redisClient = createClient({
//   url: process.env.REDIS_URL as string
// });

export const authenticateAdmin = async (req: any, res: any, next: NextFunction) => {
  
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET as string, async (err:any, admin:any) => {  
    if (err) return res.status(403).json({ message: "Invalid token" });
    const exist = await tokenExists(admin.id);
    if (!exist) {
      return res.status(401).json({ message: 'Token revoked' });
    }
    req.admin = admin; // Admin payload from token (e.g., id, email, privilege)
    next();
  });
};

export const authorizePrivilege = (requiredPrivilege: number) => {
  return (req: any, res: any, next: NextFunction) => {
    const admin = req.admin;

    if (!admin || admin.privilege < requiredPrivilege) {
      return res.status(403).json({ message: "Insufficient privileges" });
    }

    next();
  };
};

// Token Service
export const tokenService = {
  
  storeToken: async (token: string, userId: string): Promise<void> => {
      
    const decoded = jwt.decode(token) as { exp: number };
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    
    await setItem(userId, token, ttl);
  },

  revokeToken: async (userId: string): Promise<void> => {
    await deleteItem(userId);
  }
};
