import { useEffect, useMemo, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { Square } from "chess.js";

import { apiBaseUrl } from "@/config/api";
import { useChessGameState } from "@/hooks/game/useChessGameState";

interface OpponentSummary {
  nickname: string;
  avatar: string;
  rating: number;
  country: string;
}

interface ServerErrorPayload {
  message: string;
}

interface RoomCreatedPayload {
  room: string;
}

interface GameStartPayload {
  white: string;
  black: string;
  room: string;
  fen: string;
}

interface JwtValidatedPayload {
  room: string;
}

interface MovePayload {
  fen: string;
}

interface OpponentProfilePayload {
  nickname?: string;
  avatar?: string;
  rating?: number;
  country?: string;
}

interface OpponentDisconnectedPayload {
  message: string;
}

const defaultOpponent: OpponentSummary = {
  nickname: "Waiting for opponent...",
  avatar: "null",
  rating: -1,
  country: "",
};

export function useMultiplayerSession() {
  const initialRoom = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("room");
  }, []);
  const socketRef = useRef<Socket | null>(null);
  const colorRef = useRef<string | null>(null);
  const shareResetTimeoutRef = useRef<number | null>(null);
  const {
    game,
    whiteWins,
    blackWins,
    stalemate,
    makeMove,
    resetGame,
    setGameFromFen,
  } = useChessGameState();
  const [gameStarted, setGameStarted] = useState(false);
  const [status, setStatus] = useState<string>(initialRoom ? "Joining game..." : "Connecting...");
  const [color, setColor] = useState<string | null>(null);
  const [gameRoom, setGameRoom] = useState<string | null>(initialRoom);
  const [shareableLink, setShareableLink] = useState<string>("");
  const [opponent, setOpponent] = useState<OpponentSummary>(defaultOpponent);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    const newSocket: Socket = io(apiBaseUrl, {
      path: "/chess/socket.io",
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;

    const updateOpponent = (data: OpponentProfilePayload) => {
      setOpponent((current) => ({
        nickname: data.nickname || current.nickname,
        avatar: data.avatar || current.avatar,
        rating: data.rating ?? current.rating,
        country: data.country || current.country,
      }));
    };

    newSocket.on("connect", () => {
      console.log("Connected:", newSocket.id);
      if (initialRoom) {
        newSocket.emit("joinRoom", { room: initialRoom });
      } else {
        setStatus("Creating game room...");
      }
    });

    newSocket.on("connect_error", (error: Error) => {
      console.error("Connection error:", error);
      setStatus("Failed to connect to server");
    });

    newSocket.on("error", (data: ServerErrorPayload) => {
      console.error("Server error:", data);
      setStatus(data.message);
    });

    newSocket.on("roomCreated", (data: RoomCreatedPayload) => {
      console.log("Room created:", data);
      setGameRoom(data.room);
      setStatus("Waiting for opponent...");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("room", data.room);
      window.history.pushState({}, "", newUrl.toString());
      setShareableLink(newUrl.toString());
    });

    newSocket.on("gameStart", (data: GameStartPayload) => {
      if (data.white === data.black) {
        console.error("Error: Same player assigned as both White and Black");
        setStatus("Error: Invalid game setup");
        return;
      }

      const playerColor = data.white === newSocket.id ? "White" : "Black";
      setColor(playerColor);
      setGameRoom(data.room);
      setGameFromFen(data.fen);
      setStatus(`Playing as ${playerColor}`);
      setGameStarted(true);

      const token = localStorage.getItem("JWT");
      if (token && data.room) {
        newSocket.emit("submitJWT", { room: data.room, token });
      } else {
        console.error("No JWT token found or room missing");
        setStatus("Authentication error: No token found");
      }
    });

    newSocket.on("jwtValidated", (data: JwtValidatedPayload) => {
      console.log("JWT validated:", data);
      setStatus(`Playing as ${colorRef.current} (Authenticated)`);

      if (!data.room) {
        return;
      }

      let profileReceived = false;

      const requestOpponentProfile = (attempts = 0) => {
        if (attempts >= 3) {
          if (!profileReceived) {
            setStatus("Failed to get opponent data");
          }
          return;
        }

        console.log(`Requesting opponent profile (attempt ${attempts + 1})...`);
        newSocket.emit("getOpponentProfile", { room: data.room });

        window.setTimeout(() => {
          if (!profileReceived) {
            requestOpponentProfile(attempts + 1);
          }
        }, 1500);
      };

      const onOpponentProfile = (profileData: OpponentProfilePayload) => {
        profileReceived = true;
        console.log("Opponent profile received:", profileData);
        updateOpponent(profileData);
        newSocket.off("opponentProfile", onOpponentProfile);
      };

      newSocket.on("opponentProfile", onOpponentProfile);
      requestOpponentProfile();
    });

    newSocket.on("move", (data: MovePayload) => {
      console.log(`[${newSocket.id}] Move received:`, data);
      try {
        setGameFromFen(data.fen);
      } catch (error) {
        console.error(`[${newSocket.id}] Error applying move:`, error, data);
        setStatus("Error applying move");
      }
    });

    newSocket.on("opponentProfile", (data: OpponentProfilePayload) => {
      console.log("Opponent profile received:", data);
      updateOpponent(data);
    });

    newSocket.on("gameReset", (data: MovePayload) => {
      console.log(`[${newSocket.id}] Game reset:`, data);
      setGameFromFen(data.fen);
      setStatus(`Playing as ${colorRef.current}`);
    });

    newSocket.on("opponentDisconnected", (data: OpponentDisconnectedPayload) => {
      console.log("Opponent disconnected:", data);
      setStatus(data.message);
      setColor(null);
      setGameRoom(null);
      resetGame();
      setShareableLink("");
      setGameStarted(false);
      setOpponent({
        ...defaultOpponent,
        nickname: "Opponent left the game",
      });
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("room");
      window.history.pushState({}, "", newUrl.toString());
    });

    return () => {
      if (shareResetTimeoutRef.current) {
        window.clearTimeout(shareResetTimeoutRef.current);
      }
      console.log("useEffect cleanup: Disconnecting socket");
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [initialRoom, resetGame, setGameFromFen]);

  const makeMultiplayerMove = (move: { from: string; to: string; promotion?: string }) => {
    const socket = socketRef.current;

    if (!socket || !gameRoom || !color) {
      console.error("Cannot make move: socket, gameRoom, or color missing");
      setStatus("Game not initialized");
      return null;
    }

    const isWhiteTurn = game.turn() === "w";
    const isPlayerTurn = (color === "White" && isWhiteTurn) || (color === "Black" && !isWhiteTurn);

    if (!isPlayerTurn) {
      console.log("Not your turn:", { color, isWhiteTurn });
      setStatus("Not your turn!");
      return null;
    }

    try {
      const result = makeMove(move);

      if (result) {
        console.log(`[${socket.id}] Move made locally:`, move, "FEN:", game.fen());
        socket.emit("move", { room: gameRoom, move });
        return result;
      }

      console.error(`[${socket.id}] Invalid move:`, move);
      setStatus("Invalid move");
      return null;
    } catch (error) {
      console.error(`[${socket.id}] Error making move:`, error, move);
      setStatus("Error making move");
      return null;
    }
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    const piece = game.get(sourceSquare as Square);
    let promotion: string | undefined;

    if (
      piece &&
      piece.type === "p" &&
      ((piece.color === "w" && targetSquare[1] === "8") || (piece.color === "b" && targetSquare[1] === "1"))
    ) {
      promotion = "q";
    }

    const move = makeMultiplayerMove({
      from: sourceSquare,
      to: targetSquare,
      promotion,
    });

    return !!move;
  };

  const copyLinkToClipboard = () => {
    if (!shareableLink) {
      return;
    }

    navigator.clipboard.writeText(shareableLink);
    setStatus("Link copied to clipboard");
    if (shareResetTimeoutRef.current) {
      window.clearTimeout(shareResetTimeoutRef.current);
    }
    shareResetTimeoutRef.current = window.setTimeout(() => {
      setStatus(`Playing as ${colorRef.current}`);
    }, 2000);
  };

  return {
    game,
    gameStarted,
    status,
    color,
    gameRoom,
    shareableLink,
    whiteWins,
    blackWins,
    stalemate,
    opponent,
    onDrop,
    copyLinkToClipboard,
  };
}
