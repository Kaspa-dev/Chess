import { DataSource } from "typeorm";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "./entity/User.js";
import { Profile } from "./entity/Profile.js";
import { Match } from "./entity/Match.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DB = new DataSource({
  type: "postgres",
  host: "localhost", 
  port: 5431,
  username: "chess",
  password: "chess",
  database: "chess",
  synchronize: true, 
  logging: false,
  entities: [User, Profile, Match],
});

DB.initialize()
  .then(() => {
    console.log("Database connected successfully!");
  })
  .catch((error) => console.log("Database connection error:", error));
