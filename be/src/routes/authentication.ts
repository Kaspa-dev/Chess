import express from "express";
import { changePassword, register, sendConfirmation, editProfile } from "../controllers/authentication.js";
import { login } from "../controllers/authentication.js";
import validateJWT from "../middleware/requestAuthorization.js";

const authenticationRouter = express.Router();

authenticationRouter.post("/sendConfirmation", sendConfirmation);

authenticationRouter.post("/register", register);
authenticationRouter.post("/login", login);
authenticationRouter.patch("/changepassword", validateJWT, changePassword)
authenticationRouter.patch("/editprofile", validateJWT, editProfile)

export default authenticationRouter;