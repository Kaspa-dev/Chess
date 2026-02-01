import { DB } from "../data-source.js";
import { User } from "../entity/User.js";

export const userRepository = DB.getRepository(User);