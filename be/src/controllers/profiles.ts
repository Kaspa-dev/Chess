import { RequestHandler, Response, Request, response } from "express";
import { AuthRequest } from "../middleware/requestAuthorization.js";
import { DB } from "../data-source.js";
import { User } from "../entity/User.js";
import { Profile } from "../entity/Profile.js";
import sharp from 'sharp';
import axios from 'axios';
import * as qs from 'qs';

const userRepository = DB.getRepository(User);
const profileRepository = DB.getRepository(Profile);

const imgBB: string = "d9f5161cbc88a47379c109986c14bfb5";

export const myprofile: RequestHandler = async (req: AuthRequest, res: Response) => {
    const user = req.authorizedUser;

    const userEmail = user.email;

    if(!userEmail) {
        res.status(401).json({message: "No credentials found"});
        return;
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
        res.status(404).json({message: "Couldn't find the associated profile"});
        return;
    }

    res.status(200).json({message:"Profile found", profile});
};

export const otherprofile: RequestHandler = async (req: Request, res: Response) => {
    const id: number = Number(req.query.id);

    if (!id) {
        res.status(400).json({message: "No id given"});
        return;
    }

    try {
        const profile = await profileRepository.findOne({ where: { id: id } });

        if (!profile) {
            res.status(404).json({message: "Profile does not exist"});
            return;
        }

        res.status(200).json({message: "Profile found successfully", profile});
    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({message: "Server error"});
    }
};

export const getMyAvatar: RequestHandler = async (req: AuthRequest, res: Response) => {
    const userEmail = req.authorizedUser.email;

    if(!userEmail) {
        res.status(401).json({message: "No credentials found"});
        return;
    }

    try {
        const profile = await profileRepository.findOne({
            where:{
                user:{
                    email:userEmail,
                },
            },
        });

        if(!profile){
            res.status(404).json({message: "Couldn't find the associated profile"});
            return;
        }

        res.status(200).json({message:"Profile found", avatar: profile.avatar});
    } catch (error) {
        res.status(500).json({message: "Server error"});
    }
}

export const getOtherAvatar: RequestHandler = async (req: AuthRequest, res: Response) => {
    const id: number = Number(req.body.id);

    if (!id) {
        res.status(400).json({message: "No ID provided"});
        return;
    }

    try {
        const profile = await profileRepository.findOne({ where: { id: id } });

        if (!profile) {
            res.status(404).json({message: "Profile does not exist"});
            return;
        }

        res.status(200).json({message: "Avatar found successfully", avatar: profile.avatar});
    } catch (error) {
        res.status(500).json({message: "Server error"});
    }
}

export const uploadAvatar: RequestHandler = async (req: any, res: Response) => { 
    const image = req.file;
    const userEmail = req.authorizedUser.email;

    if(!image) {
        res.status(400).json({message: "No image provided"});
        return;
    }

    if(!userEmail) {
        res.status(401).json({message: "No credentials found"});
        return;
    }
    try{
        const metadata = await sharp(image.buffer).metadata();

        if (image.size > 32 * 1024 * 1024) { 
            res.status(400).json({ error: 'Image size must be less than or equal to 32MB' });
            return;
        }

        if((metadata.width || 0) < 300 || (metadata.height || 0) < 300) {
            res.status(400).json({message: "Image is too small and should be at least 300x300 pixels"});
            return;
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
            res.status(500).json({message: "Couldn't upload the image"});
            return;
        }

        const profile = await profileRepository.findOne({
            where:{
                user:{
                    email:userEmail,
                },
            },
        });

        if(!profile){
            res.status(404).json({message: "Couldn't find the associated profile"});
            return;
        }

        profile.avatar = response.data.data.url;
        await profileRepository.save(profile);
        res.status(200).json({message: "Avatar updated successfully"});

    } catch (error) {
        res.status(400).json({message: "Invalid image format"});
        console.error("Image error:", error);
        return;
    }
}
