import express from "express";
import { getMyAvatar, getOtherAvatar, myprofile, otherprofile, uploadAvatar } from "../controllers/profiles.js";
import validateJWT from "../middleware/requestAuthorization.js";
import multer from 'multer';

const profilesRouter = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

profilesRouter.get("/myprofile", validateJWT, myprofile);
profilesRouter.get("/profile", otherprofile);
profilesRouter.get("/myavatar", validateJWT, getMyAvatar);
profilesRouter.get("/avatar", validateJWT, getOtherAvatar);
profilesRouter.patch("/uploadavatar", validateJWT, upload.single("image"), uploadAvatar);

export default profilesRouter;