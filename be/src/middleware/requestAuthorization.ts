import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authConfig } from "../config.js";
import { AppError } from "../errors/AppError.js";

export interface AuthRequest extends Request {
    authorizedUser?: any;
}

const validateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        next(new AppError(401, "A Bearer token must be provided", "MISSING_BEARER_TOKEN"));
        return;
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
        const decoded = jwt.verify(token, authConfig.jwtSecret);
        req.authorizedUser = decoded;
        next();
    } catch (error) {
        next(new AppError(403, "Forbidden: Invalid token", "INVALID_TOKEN"));
        return;
    }
  };

export default validateJWT;
