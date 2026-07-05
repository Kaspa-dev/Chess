import { RequestHandler, Response, Request } from "express";
import { AuthRequest } from "../middleware/requestAuthorization.js";
import { DB } from "../data-source.js";
import { User } from "../entity/User.js";
import { Profile } from "../entity/Profile.js";
import sharp from 'sharp';
import axios from 'axios';
import * as qs from 'qs';
import { AppError } from "../errors/AppError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const userRepository = DB.getRepository(User);
const profileRepository = DB.getRepository(Profile);

const imgBB: string = "d9f5161cbc88a47379c109986c14bfb5";

export const myprofile: RequestHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.authorizedUser;

    const userEmail = user.email;

    if(!userEmail) {
        throw new AppError(401, "No credentials found", "MISSING_CREDENTIALS");
    }

    const profile = await profileRepository.findOne({
        where:{
            user:{
                email:userEmail,
            },
        },
        relations:["user"]
    });

    if(!profile){
        throw new AppError(404, "Couldn't find the associated profile", "PROFILE_NOT_FOUND");
    }

    res.status(200).json({message:"Profile found", profile});
});

export const otherprofile: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const id: number = Number(req.query.id);

    if (!id) {
        throw new AppError(400, "No id given", "VALIDATION_ERROR");
    }

    const profile = await profileRepository.findOne({ where: { id: id } });

    if (!profile) {
        throw new AppError(404, "Profile does not exist", "PROFILE_NOT_FOUND");
    }

    res.status(200).json({message: "Profile found successfully", profile});
});

export const getMyAvatar: RequestHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userEmail = req.authorizedUser.email;

    if(!userEmail) {
        throw new AppError(401, "No credentials found", "MISSING_CREDENTIALS");
    }

    const profile = await profileRepository.findOne({
        where:{
            user:{
                email:userEmail,
            },
        },
    });

    if(!profile){
        throw new AppError(404, "Couldn't find the associated profile", "PROFILE_NOT_FOUND");
    }

    res.status(200).json({message:"Profile found", avatar: profile.avatar});
});

export const getOtherAvatar: RequestHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id: number = Number(req.body.id);

    if (!id) {
        throw new AppError(400, "No ID provided", "VALIDATION_ERROR");
    }

    const profile = await profileRepository.findOne({ where: { id: id } });

    if (!profile) {
        throw new AppError(404, "Profile does not exist", "PROFILE_NOT_FOUND");
    }

    res.status(200).json({message: "Avatar found successfully", avatar: profile.avatar});
});

export const uploadAvatar: RequestHandler = asyncHandler(async (req: any, res: Response) => { 
    const image = req.file;
    const userEmail = req.authorizedUser.email;

    if(!image) {
        throw new AppError(400, "No image provided", "VALIDATION_ERROR");
    }

    if(!userEmail) {
        throw new AppError(401, "No credentials found", "MISSING_CREDENTIALS");
    }
    try{
        const metadata = await sharp(image.buffer).metadata();

        if (image.size > 32 * 1024 * 1024) { 
            throw new AppError(400, "Image size must be less than or equal to 32MB", "VALIDATION_ERROR");
        }

        if((metadata.width || 0) < 300 || (metadata.height || 0) < 300) {
            throw new AppError(400, "Image is too small and should be at least 300x300 pixels", "VALIDATION_ERROR");
        }

        const response = await axios.post("https://api.imgbb.com/1/upload", qs.stringify({
          key: imgBB,
          image: image.buffer.toString('base64'),
          name: userEmail,
          expiration: 604800,
        }), {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if(response.status !== 200) {
            throw new AppError(500, "Couldn't upload the image", "IMAGE_UPLOAD_FAILED");
        }

        const profile = await profileRepository.findOne({
            where:{
                user:{
                    email:userEmail,
                },
            },
        });

        if(!profile){
            throw new AppError(404, "Couldn't find the associated profile", "PROFILE_NOT_FOUND");
        }

        profile.avatar = response.data.data.url;
        await profileRepository.save(profile);
        res.status(200).json({message: "Avatar updated successfully"});

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(400, "Invalid image format", "INVALID_IMAGE_FORMAT");
    }
});
