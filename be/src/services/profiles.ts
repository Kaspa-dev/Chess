import { DB } from "../data-source.js";
import { Profile } from "../entity/Profile.js";
import { User } from "../entity/User.js";


const profileRepository = DB.getRepository(Profile);

const createProfileOnRegister = async (user: User): Promise<Profile> => {
    try{
        const existingProfile = await profileRepository.findOne({
            where:{
                user:{
                    id:user.id,
                },
            },
            relations:["user"]
        })
    
        if(existingProfile) {
            return existingProfile;
        }
    
        const newProfile = profileRepository.create({
            nickname: user.email.split("@")[0], 
            country: null, 
            user,
        });
    
        await profileRepository.save(newProfile);
        return newProfile;
    } catch (error: any) {
        console.log(error);
        throw error;
    }
};

export {createProfileOnRegister};

