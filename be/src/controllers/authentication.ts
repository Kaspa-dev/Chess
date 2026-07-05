import { Request, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../entity/User.js";
import { DB } from "../data-source.js";
import { createProfileOnRegister } from "../services/profiles.js";
import { Profile } from "../entity/Profile.js";
import { AuthRequest } from "../middleware/requestAuthorization.js";
import nodemailer  from "nodemailer";
import { authConfig, frontendConfig, getMailConfig } from "../config.js";
import { AppError } from "../errors/AppError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const userRepository = DB.getRepository(User);
const profileRepository = DB.getRepository(Profile);

export const sendConfirmation: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError(400, "Email and password are required", "VALIDATION_ERROR");
    }

    if(email.length < 3 || email.length > 254) {
      throw new AppError(400, "Email must be between 3 and 254 characters long", "VALIDATION_ERROR");
    }

    if(password.length < 8 || password.length > 64) {
      throw new AppError(400, "Password must be between 8 and 64 characters long", "VALIDATION_ERROR");
    }

    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
        throw new AppError(401, "User already exists", "USER_ALREADY_EXISTS");
    }

    const token = jwt.sign({ password: password, email: email }, authConfig.jwtSecret, {
        expiresIn: "5m",
    });

    const mailConfig = getMailConfig();

    var Transport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: mailConfig.user,
            pass: mailConfig.pass
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    var mailOptions;
    let sender = mailConfig.from;
    mailOptions = {
        from: sender,
        to: email,
        subject: "Email confirmation",
        html: `Press <a href="${frontendConfig.baseUrl}/register?token=${token}">here</a> to verify your email.`
    }

    const info = await Transport.sendMail(mailOptions);
    console.log("Full sendMail info:", info);
    res.status(200).json({message: "We sent a confirmation email to " + email, token: token});
});

export const register: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

    console.log("email: " + email);
    console.log("password: " + password);

  if (!email || !password) {
    throw new AppError(400, "Email and password are required", "VALIDATION_ERROR");
  }

  const existingUser = await userRepository.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError(401, "User already exists", "USER_ALREADY_EXISTS");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = userRepository.create({ email, password: hashedPassword});
  await userRepository.save(user);

  const newProfile = await createProfileOnRegister(user);

  user.profile = newProfile;
  await userRepository.save(user);

  const token = jwt.sign({ id: user.id, email: user.email }, authConfig.jwtSecret, {
    expiresIn: "2h",
  });

  res.status(201).json({ message: "User registered", token });
});

export const login: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError(400, "Email and password are required", "VALIDATION_ERROR");
    }

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
        throw new AppError(404, "Account does not exist", "ACCOUNT_NOT_FOUND");
    }

    const isMatching = await bcrypt.compare(password, user.password);
    if (!isMatching){
        throw new AppError(401, "Incorrect password", "INVALID_CREDENTIALS");
    }

    const token = jwt.sign({ id: user.id, email: user.email }, authConfig.jwtSecret, {
        expiresIn: "2h",
    });

    res.status(200).json({ message: "User logged in successfully", token });
});

export const editProfile: RequestHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.authorizedUser;
  if (!email) {
    throw new AppError(500, "Something went wrong. JWT is not assigned to a user.", "JWT_USER_MISSING");
  }

  const { newUserName, newCountry } = req.body;

  if (!newUserName || !newCountry) {
    throw new AppError(400, "New username or country are required.", "VALIDATION_ERROR");
  }

  if (newUserName && (newUserName.length < 3 || newUserName.length > 64)) {
    throw new AppError(400, "The new username must be between 8 and 64 characters long", "VALIDATION_ERROR");
  }

  const user = await userRepository.findOne({
    where: { email },
    relations: ["profile"],
  });

  if (!user) {
    throw new AppError(404, "Account does not exist.", "ACCOUNT_NOT_FOUND");
  }

  if (newUserName) {
    const existingUser = await profileRepository.findOne({ where: { nickname: newUserName } });

    if (existingUser && existingUser.id !== user.profile.id) {
      throw new AppError(403, "The nickname is already taken.", "NICKNAME_ALREADY_TAKEN");
    }

    user.profile.nickname = newUserName;
  }

  if (newCountry) {
    user.profile.country = newCountry;
  }

  await profileRepository.save(user.profile);

  res.status(200).json({ message: `User ${user.email}'s profile has been updated successfully.` });
});
export const changePassword: RequestHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.authorizedUser;
  if (!email) {
    throw new AppError(500, "Something went wrong. JWT is not assigned to an user.", "JWT_USER_MISSING");
  }

  const { oldPassword, newPassword }: { oldPassword: string, newPassword: string}= req.body;
  if ( !oldPassword || !newPassword) {
    throw new AppError(400, "Old and new password are required.", "VALIDATION_ERROR");
  }

  if ( newPassword.length < 8 || newPassword.length > 64) {
    throw new AppError(400, "The new password must be between 8 and 64 characters long", "VALIDATION_ERROR");
  }

  const user = await userRepository.findOne({ where: { email } });
  if (!user) {
      throw new AppError(404, "Account does not exist.", "ACCOUNT_NOT_FOUND");
  }

  const isMatching = await bcrypt.compare(oldPassword, user.password);
  if (!isMatching){
    throw new AppError(401, "Incorrect password.", "INVALID_CREDENTIALS");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await userRepository.save(user);
  res.status(200).json({ message: `User's ${user.email} password has been updated successfully`});

});
