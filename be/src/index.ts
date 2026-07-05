import 'reflect-metadata';
import "./config.js";
import express, { urlencoded, Express, Request, Response } from "express";
import authenticationRouter from "./routes/authentication.js";
import cors from "cors";
import profilesRouter from "./routes/profiles.js";
import { errorHandler } from "./middleware/errorHandler.js";
import http from 'http';
import { Server } from 'socket.io';
import matchRouter from "./routes/games.js";
import matchHistoryRoute from "./routes/matchHistories.js";
import { registerChessSocketHandlers } from "./sockets/registerChessSocketHandlers.js";
import { frontendConfig } from "./config.js";

const port = 8000;
const app: Express = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: frontendConfig.baseUrl, methods: ['GET', 'POST'] },
    path: '/chess/socket.io'
});

app.use(cors());
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use("/authentication", authenticationRouter);
app.use("/profiles", profilesRouter);
app.use("/match", matchRouter);
app.use("/api", matchHistoryRoute); 
app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ msg: "Server is up and running" });
});

app.get("/chess", (req: Request, res: Response) => {
  res.status(200).json({ msg: "Chess server is running" });
});

registerChessSocketHandlers(io);

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}/`);
});

export default app;
