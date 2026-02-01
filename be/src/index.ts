import 'reflect-metadata';
import express, { urlencoded, json, Express, Request, Response } from "express";
import { DB } from "./data-source.js";
import authenticationRouter from "./routes/authentication.js";
import cors from "cors";
import profilesRouter from "./routes/profiles.js";
import validateJWT from "./middleware/requestAuthorization.js";
import { updateRating } from "./services/game.js"

// Define the AuthRequest interface
interface AuthRequest extends Request {
    authorizedUser?: { id?:number, email?: string };
}
import http, { request } from 'http';
import { Server, Socket } from 'socket.io';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { saveMatchData } from './services/game.js';
import { Profile } from './entity/Profile.js';
import matchRouter from "./routes/games.js";
import matchHistoryRoute from "./routes/matchHistories.js";
import { User } from './entity/User.js';
import { DebugLogger } from 'typeorm/logger/DebugLogger.js';

const port = 8000;
const app: Express = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
    path: '/chess/socket.io'
});

app.use(cors());
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use("/authentication", authenticationRouter);
app.use("/profiles", profilesRouter);
app.use("/match", matchRouter);
app.use("/api", matchHistoryRoute); 

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ msg: "Server is up and running" });
});

app.get("/chess", (req: Request, res: Response) => {
  res.status(200).json({ msg: "Chess server is running" });
});



interface Game {
    chess: Chess;
    players: { white: string; black: string };
    userEmails: { white: string | null; black: string | null };
    userIDs: { white: number | null; black: number | null };
}

interface PendingGame {
    creator: Socket;
}

const pendingGames: Map<string, PendingGame> = new Map();
const activeGames: Map<string, Game> = new Map();

io.on('connection', (socket: Socket) => {
    // Prevent duplicate connections
    for (const [room, game] of activeGames) {
        if (game.players.white === socket.id || game.players.black === socket.id) {
            console.log(`Socket ${socket.id} is already in game room ${room}`);
            socket.emit('error', { message: 'Already in a game' });
            socket.disconnect();
            return;
        }
    }

    // Create a new game room
    const roomId = uuidv4();
    pendingGames.set(roomId, { creator: socket });
    socket.join(roomId);
    console.log(`Created pending game room: ${roomId} for socket ${socket.id}`);
    socket.emit('roomCreated', { room: roomId, message: 'Share this room ID to invite a player' });

    socket.on('joinRoom', (data: { room: string }) => {
        const { room } = data;
        const pendingGame = pendingGames.get(room);
        if (!pendingGame) {
            socket.emit('error', { message: 'Room not found or game already started' });
            return;
        }
        if (pendingGame.creator.id === socket.id) {
            socket.emit('error', { message: 'Cannot join your own game' });
            return;
        }
        if (!pendingGame.creator.connected) {
            pendingGames.delete(room);
            socket.emit('error', { message: 'Room creator disconnected' });
            return;
        }

        // Start the game
        const game: Game = {
            chess: new Chess(),
            players: { white: pendingGame.creator.id, black: socket.id },
            userEmails: { white: null, black: null },
            userIDs: { white: null, black: null },
        };
        activeGames.set(room, game);
        pendingGames.delete(room);

        socket.join(room);
        console.log(`Game started: room=${room}, white=${game.players.white}, black=${socket.id}`);
        io.to(room).emit('gameStart', {
            room,
            white: game.players.white,
            black: socket.id,
            fen: game.chess.fen(),
        });
    });

    // Handle JWT token submission after game starts
    socket.on('submitJWT', (data: { room: string; token: string }) => {
        const { room, token } = data;
        console.log(`JWT token received for socket ${socket.id} in room ${room}`);
        const game = activeGames.get(room);
        if (!game) {
            socket.emit('error', { message: 'Game room not found' });
            return;
        }

        // Create a mock request object for validateJWT
        const req: Partial<AuthRequest> = {
            headers: { authorization: `Bearer ${token}` },
        };
        const res: Partial<Response> = {
            status: (code: number) => ({
                json: (body: any) => {
                    socket.emit('error', { message: body.message || 'Invalid token' });
                },
            }),
        } as Response;
        const next = () => {
            // If validation passes, inspect and store the user email
            const user = (req as AuthRequest).authorizedUser;
            console.log(`Decoded user object for socket ${socket.id}:`, user);
            if (!user) {
                console.error(`No user object attached for socket ${socket.id}`);
                socket.emit('error', { message: 'No user data in token' });
                return;
            }

            // Extract email from JWT
            const userEmail = user.email || null;
            if (!userEmail) {
                console.error(`No valid email found in user object for socket ${socket.id}:`, user);
                socket.emit('error', { message: 'No email in token' });
                return;
            }

            if (game.players.white === socket.id) {
                game.userEmails.white = userEmail;
                game.userIDs.white = user.id ?? null;
                console.log(`White player ${socket.id} authenticated, email: ${userEmail}, id: ${user.id}`);
            } else if (game.players.black === socket.id) {
                game.userEmails.black = userEmail;
                game.userIDs.black = user.id ?? null;
                console.log(`Black player ${socket.id} authenticated, email: ${userEmail}, id: ${user.id}`);
            }
            socket.emit('jwtValidated', { message: 'Token validated successfully', room: room });
        };

        // Validate the JWT
        try {
            validateJWT(req as AuthRequest, res as Response, next);
        } catch (error) {
            console.error(`Error validating JWT for socket ${socket.id}:`, error);
            socket.emit('error', { message: 'Token validation failed' });
        }
    });

    // In your socket.on('getOpponentProfile') handler in index.ts
    socket.on('getOpponentProfile', async (data: { room: string }) => {
        const { room } = data;
        const game = activeGames.get(room);

        if (!game) {
            socket.emit('error', { message: 'Game room not found' });
            return;
        }

    

        let opponentId: number | null = null;
        if (game.players.white === socket.id) {
            opponentId = game.userIDs.black;
            console.log(`Opponent for WHITE player ${socket.id} is BLACK player with ID ${opponentId}`);
        } else if (game.players.black === socket.id) {
            opponentId = game.userIDs.white;
            console.log(`Opponent for BLACK player ${socket.id} is WHITE player with ID ${opponentId}`);
        } else {
            console.error(`Socket ${socket.id} is not a player in room ${room}`);
            socket.emit('error', { message: 'You are not a player in this game' });
            return;
        }

        if (!opponentId) {
            console.error(`Couldn't determine opponent ID for socket ${socket.id} in room ${room}`);
            return;
        }

        try {
            const userRepository = DB.getRepository(User);
            const opponentUser = await userRepository.findOne({ 
                where: { id: opponentId },
                relations: ['profile'] // Make sure to load the profile relation
            });

            if (!opponentUser || !opponentUser.profile) {
                console.error(`Profile not found for ID ${opponentId}`);
                socket.emit('error', { message: 'Opponent profile not found' });
                return;
            }

            socket.emit('opponentProfile', {
                nickname: opponentUser.profile.nickname,
                avatar: opponentUser.profile.avatar || 'null',
                rating: opponentUser.profile.rating || 0,
                country: opponentUser.profile.country || "null"
            });
            console.log(`Opponent profile sent to ${socket.id}: ${opponentUser.profile.nickname}`);
        } catch (error) {
            console.error(`Error fetching opponent profile:`, error);
            socket.emit('error', { message: 'Error fetching opponent data' });
        }
    });

    socket.on('move', (data: { room: string; move: { from: string; to: string; promotion?: string } }) => {
        const { room, move } = data;
        const game = activeGames.get(room);
        if (!game) {
            socket.emit('error', { message: 'Game room not found' });
            return;
        }

        const isWhiteTurn = game.chess.turn() === 'w';
        const playerId = socket.id;
        const isPlayerTurn =
            (isWhiteTurn && game.players.white === playerId) ||
            (!isWhiteTurn && game.players.black === playerId);
        if (!isPlayerTurn) {
            socket.emit('error', { message: 'Not your turn' });
            return;
        }

        try {
            const result = game.chess.move(move);
            if (result) {
                console.log(`Move made in room ${room}: ${JSON.stringify(move)}`);
                io.to(room).emit('move', { move, fen: game.chess.fen() });

                if (game.chess.isCheckmate()) {
                    const winner = game.chess.turn() === 'w' ? 'black' : 'white';
                    const winnerEmail = game.userEmails[winner];
                    console.log(`Checkmate! ${winner} wins in room ${room}`);
                    io.to(room).emit('gameOver', {
                        message: `${winner} wins!`,
                        winnerEmail,
                    });

                    //Makes call to game.ts service to update the ratings
                    (async () => {
                        try {
                            const result = await updateRating({
                                firstPlayer: game.userEmails['white'],
                                secondPlayer: game.userEmails['black'],
                                winner: game.userEmails[winner]
                            });
                            console.log("Rating update result: " + result?.message);
                        } catch (error) {
                            console.error('Error:', error);
                        }
                    })();

                    if(game.userEmails.white && game.userEmails.black) saveMatchData(game.userEmails.white, game.userEmails.black, winnerEmail, new Date(), room);
                    activeGames.delete(room);
                } else if (game.chess.isStalemate()) {
                    console.log(`Draw in room ${room}`);
                    io.to(room).emit('gameOver', { message: 'Draw!' });
                    if(game.userEmails.white && game.userEmails.black) saveMatchData(game.userEmails.white, game.userEmails.black, null, new Date(), room);
                    activeGames.delete(room);
                }
            } else {
                socket.emit('error', { message: 'Invalid move' });
            }
        } catch (error) {
            console.error(`Invalid move in room ${room}: ${JSON.stringify(move)}`, error);
            socket.emit('error', { message: 'Invalid move' });
        }
    });

    socket.on('newGame', (data: { room: string }) => {
        const { room } = data;
        const game = activeGames.get(room);
        if (!game) {
            socket.emit('error', { message: 'Game room not found' });
            return;
        }
        game.chess = new Chess();
        console.log(`New game started in room ${room}`);
        io.to(room).emit('gameReset', {
            fen: game.chess.fen(),
            message: 'New game started',
        });
    });

    socket.on('reconnect', (data: { room: string }) => {
        const { room } = data;
        const game = activeGames.get(room);
        if (!game) {
            socket.emit('error', { message: 'Game room not found' });
            return;
        }
        if (game.players.white !== socket.id && game.players.black !== socket.id) {
            socket.emit('error', { message: 'Not a player in this game' });
            return;
        }
        socket.join(room);
        socket.emit('gameStart', {
            room,
            white: game.players.white,
            black: game.players.black,
            fen: game.chess.fen(),
        });
        console.log(`Player ${socket.id} reconnected to room ${room}`);
    });

    socket.on('disconnect', () => {
        console.log(`Disconnected from chess: ${socket.id}`);
        // Clean up pending games
        for (const [room, pendingGame] of pendingGames) {
            if (pendingGame.creator.id === socket.id) {
                pendingGames.delete(room);
                console.log(`Removed pending game room ${room} due to creator disconnection`);
            }
        }
        // End active games
        for (const [room, game] of activeGames) {
            if (game.players.white === socket.id || game.players.black === socket.id) {
                io.to(room).emit('opponentDisconnected', { message: 'Opponent disconnected' });
                activeGames.delete(room);
                console.log(`Ended game in room ${room} due to disconnection`);
                break;
            }
        }
    });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}/`);
});

export default app;