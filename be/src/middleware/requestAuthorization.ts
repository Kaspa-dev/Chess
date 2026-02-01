import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    authorizedUser?: any;
}

const validateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "A Bearer token must be provided" });
        return;
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
        const decoded = jwt.verify(token, "7kP$mN9xQz!vR2tL&jW5bY8sF3hA*eDg");
        req.authorizedUser = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: "Forbidden: Invalid token" });
        return;
    }
  };

export default validateJWT;