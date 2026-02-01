import { Request, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../entity/User.js";
import { DB } from "../data-source.js";
import { createProfileOnRegister } from "../services/profiles.js";
import { Profile } from "../entity/Profile.js";
import { AuthRequest } from "../middleware/requestAuthorization.js";
import nodemailer  from "nodemailer";

const JWT_SECRET = "7kP$mN9xQz!vR2tL&jW5bY8sF3hA*eDg";
const userRepository = DB.getRepository(User);
const profileRepository = DB.getRepository(Profile);

export const sendConfirmation: RequestHandler = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
    }

    if(email.length < 3 || email.length > 254) {
      res.status(400).json({ message: "Email must be between 3 and 254 characters long"});
      return;
    }

    if(password.length < 8 || password.length > 64) {
      res.status(400).json({ message: "Password must be between 8 and 64 characters long"});
      return;
    }

    try {
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            res.status(401).json({ message: "User already exists" });
            return;
        }

        const token = jwt.sign({ password: password, email: email }, JWT_SECRET, {
            expiresIn: "5m",
        });

        var Transport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: "inkvizitoriaichess@gmail.com",
                pass: "cbka tcot zzjv codv"
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        var mailOptions;
        let sender = "Inkvizitoriai <inkvizitoriaichess@gmail.com>";
        mailOptions = {
            from: sender,
            to: email,
            subject: "Email confirmation",
            html: `Press <a href="http://localhost:5173/register?token=${token}">here</a> to verify your email.`
        }

        const info = await Transport.sendMail(mailOptions);
        console.log("Full sendMail info:", info);
        res.status(200).json({message: "We sent a confirmation email to " + email, token: token});
    }
    catch (error: any) {
        console.log("Įvyko error: " + error);
    }
};

export const register: RequestHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;

    console.log("email: " + email);
    console.log("password: " + password);

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  try {
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(401).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepository.create({ email, password: hashedPassword});
    await userRepository.save(user);

    await createProfileOnRegister(user);

    const newProfile = await createProfileOnRegister(user);

    user.profile = newProfile;
    await userRepository.save(user);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "2h",
    });

    res.status(201).json({ message: "User registered", token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const login: RequestHandler = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
    }

    try {
        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            res.status(404).json({ message: "Account does not exist" });
            return;
        }

        const isMatching = await bcrypt.compare(password, user.password);
        if (!isMatching){
            res.status(401).json({ message: "Incorrect password" });
            return;
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: "2h",
        });

        res.status(200).json({ message: "User logged in successfully", token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const editProfile: RequestHandler = async (req: AuthRequest, res: Response) => {
  const { email } = req.authorizedUser;
  if (!email) {
    res.status(500).json({ message: "Something went wrong. JWT is not assigned to a user." });
    return;
  }

  const { newUserName, newCountry } = req.body;

  if (!newUserName || !newCountry) {
    res.status(400).json({ message: "New username or country are required." });
    return;
  }

  if (newUserName && (newUserName.length < 3 || newUserName.length > 64)) {
    res.status(400).json({ message: "The new username must be between 8 and 64 characters long" });
    return;
  }

  try {
    const user = await userRepository.findOne({
      where: { email },
      relations: ["profile"],
    });

    if (!user) {
      res.status(404).json({ message: "Account does not exist." });
      return;
    }

    if (newUserName) {
      const existingUser = await profileRepository.findOne({ where: { nickname: newUserName } });

      if (existingUser && existingUser.id !== user.profile.id) {
        res.status(403).json({ message: "The nickname is already taken." });
        return;
      }

      user.profile.nickname = newUserName;
    }

    if (newCountry) {
      user.profile.country = newCountry;
    }

    await profileRepository.save(user.profile);

    res.status(200).json({ message: `User ${user.email}'s profile has been updated successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong." });
  }
};
export const changePassword: RequestHandler = async (req: AuthRequest, res: Response) => {
  const { email } = req.authorizedUser;
  if (!email) {
    res.status(500).json({message: "Something went wrong. JWT is not assigned to an user."});
    return;
  }

  const { oldPassword, newPassword }: { oldPassword: string, newPassword: string}= req.body;
  if ( !oldPassword || !newPassword) {
    res.status(400).json({message: "Old and new password are required."});
    return;
  }

  if ( newPassword.length < 8 || newPassword.length > 64) {
    res.status(400).json({message: "The new password must be between 8 and 64 characters long"});
    return;
  }

  try {
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
        res.status(404).json({ message: "Account does not exist." });
        return;
    }

    const isMatching = await bcrypt.compare(oldPassword, user.password);
    if (!isMatching){
      res.status(401).json({ message: "Incorrect password." });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await userRepository.save(user);
    res.status(200).json({ message: `User's ${user.email} password has been updated successfully`});

  } catch (error) {
      console.log(error);
      res.status(500).json({message: "Something went wrong."});
      return;
  }
}