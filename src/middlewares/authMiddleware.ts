import { Request, Response, NextFunction } from "express";
import { setItem, getItem, deleteItem, tokenExists } from '../utils/redis';
import { createClient } from 'redis';
import jwt from "jsonwebtoken";
import dotenv from "dotenv"


export const authenticateJWT = async (req: any, res: any, next: NextFunction) => {
  
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET as string, async (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    const exist = await tokenExists(user.id);
    if (!exist) {
      return res.status(401).json({ message: 'Token revoked' });
    }
    req.user = user;
    next();
  });
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